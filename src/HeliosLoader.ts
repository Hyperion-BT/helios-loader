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

const IMPORT_RE = /import\s*\{[\s\S]*\}[\s]*from[\s]*(\"[^\"]*\")/gm

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

		const importStatements = Array.from(src.matchAll(IMPORT_RE))

		const result: string[] = []
		const deps: Dependencies = {}

		for (let statement of importStatements) {
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
constructor()
compile(optimize?: boolean): helios.UplcProgram
}

export default Program
`
        )
    }

    emitWrappedScript(dependencies: Dependencies, src: string) {
        return (
`export default class Program {
    #program

    constructor() {
        // load all the dependencies
        const allDeps = [${Object.keys(dependencies).join(", ")}]

        const depSrcs = new Map()

        function addDepSrcs(dep) {
            depSrcs.set(dep.name, dep.src)

            for (let d of Object.keys(dep.dependencies)) {
                addDepSrcs(d)
            }
        }

        for (let d of allDeps) {
            addDepSrcs(d)
        }

        this.#program = helios.Program.new(\`${src}\`, Array.from(depSrcs.values()))
    }

    /**
     * @param {boolean} optimize
     */
    compile(optimize = false) {
        return this.#program.compile(optimize)
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
            depSrcs.set(dep.name, dep.src)

            for (let d of Object.keys(dep.dependencies)) {
                const p = joinPath(dir, dep.dependencies[d])
                const m = await readModule(p)

                addDepSrcs(dirname(p), m)
            }
        }

        const dir = this.currentDir

        for (let d of Object.keys(dependencies)) {
            await addDepSrcs(dir, await readModule(joinPath(dir, dependencies[d])))
        }

        console.log(`Compiling ${this.currentFile} with Helios ${this.#helios.VERSION}`)

        this.#helios.Program.new(src, Array.from(depSrcs.values()))
    }

	async loadScript(dependencies: Dependencies, src: string): Promise<string> {
        await this.testCompilation(dependencies, src)

        if (this.options.emitTypes) {
            this.emitScriptTypes()
        }

		return this.emitWrappedScript(dependencies, src)
	}
}