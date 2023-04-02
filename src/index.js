import * as path from "path"
import * as helios from "@hyperionbt/helios"

/**
 * @typedef {any} Context
 */

const IMPORT_RE = /import[\s]*\{[\s\S]*\}[\s]*from[\s]*(\"[^\"]*\")/gm

const SRC_RE = /\`[\s\S]*\`/gm

function stripQuotes(str) {
	return str.slice(1, str.length - 1)
}

class Loader {
	#ctx

	/**
	 * @param {Context} ctx 
	 */
	constructor(ctx) {
		this.#ctx = ctx
	}

	/**
	 * @param {string} transpiled 
	 * @returns {string}
	 */
	static extractModuleSrc(transpiled) {
		const match = transpiled.match(SRC_RE)

		if (match && match.length == 1) {
			return stripQuotes(match[0])
		} else {
			throw new Error("internal error")
		}
	}

	/**
	 * @param {string} raw
	 * @return {string}
	 */
	static extractModuleName(raw) {
		const src = Loader.extractModuleSrc(raw)

		const purposeAndName = helios.extractScriptPurposeAndName(src)

		if (purposeAndName != null) {
			const [purpose, name] = purposeAndName

			if (purpose != "module") {
				throw new Error("can only import from module")
			} else {
				return name
			}
		} else {
			throw new Error("unable to parse script")
		}
	}

	/**
	 * @type {string}
	 */
	get dir() {
		return this.#ctx.context
	}

	/**
	 * @param {string} raw 
	 * @returns {Promise<string>}
	 */
	async load(raw) {
		const purposeAndName = helios.extractScriptPurposeAndName(raw)

		if (purposeAndName == null) {
			throw new Error("bad header")
		}

		const [purpose, name] = purposeAndName

		this.#ctx.cacheable(true)

		const importStatements = Array.from(raw.matchAll(IMPORT_RE))

		const result = []
		const deps = []

		for (let statement of importStatements) {
			let hlPath = statement[1]
			let hlPathInner = stripQuotes(hlPath)

			let absPath = await this.resolve(hlPathInner)
			let content = await this.loadPath(absPath)

			const depName = Loader.extractModuleName(content)

			if (statement.index == undefined) {
				throw new Error("unexpected")
			}

			// change the path by the name of the module
			raw = raw.slice(0, statement.index) + statement[0].slice(0, statement[0].length - statement[1].length) + depName + raw.slice(statement.index + statement[0].length)

			result.push(`import ${depName} from ${hlPath}`)
			deps.push(depName)
		}

		if (purpose == "module") {
			// throw an error if trying to import module from non-helios file
	
			result.push(await this.loadModule(name, deps, raw))
		} else {
			result.unshift("import * as helios from \"@hyperionbt/helios\"")
			result.push(await this.loadScript(deps, raw))
		}

		const r = result.join("\n")

		return r
	}

	/**
	 * @param {string} relPath 
	 * @returns {Promise<string>}
	 */
	resolve(relPath) {
		return new Promise((resolve, reject) => {
			this.#ctx.resolve(this.dir, relPath, (e, result) => {
				if (e) {
					reject(e)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * @param {string} request 
	 * @returns {Promise<string>}
	 */
	loadPath(request) {
		return new Promise((resolve, reject) => {
			this.#ctx.loadModule(request, (e, result) => {
				if (e) {
					reject(e)
				} else {
					resolve(result)
				}
			})
		})
	}

	/**
	 * @param {string} name
	 * @param {string[]} deps
	 * @param {string} raw 
	 * @returns {Promise<string>}
	 */
	async loadModule(name, deps, raw) {
		return (
`const m = {
	name: "${name}",
	deps: [${deps.join(", ")}],
	src: \`${raw}\`
}

export { m as default }
`
		)
	}

	/**
	 * @param {string[]} deps
	 * @param {string} raw 
	 * @returns {Promise<string>}
	 */
	async loadScript(deps, raw) {
		return (
`export default class Program {
	#program

	constructor() {
		// load all the dependencies
		const allDeps = [${deps.join(", ")}]

		const depSrcs = new Map()

		function addDepSrcs(dep) {
			depSrcs.set(dep.name, dep.src)

			for (let d of dep.deps) {
				addDepSrcs(d)
			}
		}

		for (let d of allDeps) {
			addDepSrcs(d)
		}

		this.#program = helios.Program.new(\`${raw}\`, Array.from(depSrcs.values()))
	}

	compile(optimize = false) {
		return this.#program.compile(optimize)
	}
}
`
		)
	}
}

/**
 * Called for every .hl file
 * @param {string} raw 
 */
export default function main(raw) {
	const callback = this.async()

	const loader = new Loader(this)

	loader.load(raw).then((result) => {
		callback(null, result)
	}).catch((e) => {
		callback(new Error(`${this.resourcePath}: ${e.message}`))
	})

	return undefined
}