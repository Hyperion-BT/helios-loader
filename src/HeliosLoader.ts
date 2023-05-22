import { dirname, join as joinPath } from "path"
import { writeFileSync } from "fs"

import { AsyncLoader } from "./AsyncLoader"

import { 
    Dependencies,
    Module
} from "./Module"

import { WebpackContext } from "./WebpackContext"
import { stripQuotes } from "./util"

export type HeliosLibrary = any

const IMPORT_RE = /import\s*?\{[\s\S]*?\}[\s]*?from[\s]*?(\"[^\"]*?\")/m

export class HeliosLoader extends AsyncLoader {
    #helios: HeliosLibrary

	constructor(ctx: WebpackContext, helios: HeliosLibrary) {
        super(ctx)

        this.#helios = helios
	}

	async load(src: string): Promise<string> {
		const purposeAndName = this.#helios.extractScriptPurposeAndName(src)

		if (purposeAndName == null) {
			throw new Error("bad header")
		}

		const [purpose, name] = purposeAndName

		//const importStatements = Array.from(src.matchAll(IMPORT_RE))

		const result: string[] = []
		const deps: Dependencies = {}

		let statement = src.match(IMPORT_RE);
		while (statement) {
			let hlPath = statement[1]
			let hlPathInner = stripQuotes(hlPath)


			let absPath = await this.resolve(hlPathInner)
			let content = await this.readFile(absPath)

            const dep = Module.parse(content)

			// TODO: load module entirely (lazy loading for its dependencies)

			const depName = dep.name

			if (statement.index == undefined) {
				throw new Error("unexpected")
			}

			// change the path by the name of the module
			src = src.slice(0, statement.index) + statement[0].slice(0, statement[0].length - statement[1].length) + depName + src.slice(statement.index + statement[0].length)


			result.push(`import ${depName} from ${hlPath}`)
			deps[depName] = hlPathInner

			statement = src.match(IMPORT_RE);
		}

		if (purpose == "module") {
			// throw an error if trying to import module from non-helios file
	
            const m = new Module(name, deps, src)

			result.push(m.stringify())
		} else {
			result.unshift("import * as helios from \"@hyperionbt/helios\"")
			result.push(await this.loadScript(deps, src))
		}

		const r = result.join("\n")

        return r
	}

    emitScriptTypes() {
        const declPath = this.currentFile + ".d.ts"

        writeFileSync(
            declPath, 
`import * as helios from "@hyperionbt/helios"

declare class Program {
    constructor(parameters?: {[name: string]: helios.HeliosData | any});

    get name(): string;
    get paramTypes(): {[name: string]: helios.Type};
    get parameters(): {[name: string]: helios.HeliosData | any};
    get types(): {[typeName: string]: any};

    set parameters(params: {[name: string]: helios.HeliosData | any});

    compile(optimize?: boolean): helios.UplcProgram;
    evalParam(paramName: string): helios.UplcValue;
}

export default Program
`
        )
    }

    emitWrappedScript(dependencies: Dependencies, src: string) {
        return (
`//wraps helios.Program
export default class Program {
    #program

    constructor(parameters = {}) {
        // load all the dependencies
        const allDeps = [${Object.keys(dependencies).join(", ")}]

        const depSrcs = new Map()

        function addDepSrcs(dep) {
            depSrcs.set(dep.name, dep.src)

            for (let d of dep.dependencies) {
                addDepSrcs(d)
            }
        }

        for (let d of allDeps) {
            addDepSrcs(d)
        }

        this.#program = helios.Program.new(\`${src}\`, Array.from(depSrcs.values()))

        if (Object.keys(parameters).length > 0) {
            this.#program.parameters = parameters
        }
    }

    get name() {
        return this.#program.name
    }

    get paramTypes() {
        return this.#program.paramTypes
    }

    get parameters() {
        return this.#program.parameters
    }

    get types() {
        return this.#program.types
    }

    set parameters(params) {
        this.#program.parameters = params
    }

    compile(optimize = false) {
        return this.#program.compile(optimize)
    }

    evalParam(paramName) {
        return this.#program.evalParam(paramName)
    }
}
`
        )
    }

    // TODO: return Program, so specific type declarations can be generated
    async testCompilation(dependencies: Dependencies, src: string): Promise<void> {
        const that = this

        // do a test compilation
        const depSrcs = new Map()

        async function readModule(p: string): Promise<Module> {
            const mSrc = await that.readFile(p)

            return Module.parse(mSrc)
        }

        async function addDepSrcs(dir: string, dep: Module): Promise<void> {
            if (depSrcs.has(dep.name)) {
                if (depSrcs.get(dep.name) != dep.src) {
                    throw new Error(`duplicate module name "${dep.name}"`)
                }
            } else {
                depSrcs.set(dep.name, dep.src)
            }

            for (let d of Object.keys(dep.dependencies)) {
                const p = joinPath(dir, dep.dependencies[d])
                const m = await readModule(p)

                addDepSrcs(dirname(p), m)
            }
        }

        const dir = this.currentDir

        for (let d of Object.keys(dependencies)) {
			const modulePath = joinPath(dir, dependencies[d]);
            await addDepSrcs(dirname(modulePath), await readModule(modulePath))
        }

		// for better debugging
		const filePaths = [this.currentFile].concat(Array.from(depSrcs.keys()))

		try {
			this.#helios.Program.new(src, Array.from(depSrcs.values()))
		} catch(e: any) {
			if (e instanceof this.#helios.UserError && e.src.fileIndex !== null) {
				throw new Error(`Error in ${filePaths[e.src.fileIndex]}:\n${e.message}`);
			} else {
				console.error(e);

				throw e;
			}
		}
    }

	async loadScript(dependencies: Dependencies, src: string): Promise<string> {
        await this.testCompilation(dependencies, src)

        if (this.options.emitTypes) {
            this.emitScriptTypes()
        }

		return this.emitWrappedScript(dependencies, src)
	}
}
