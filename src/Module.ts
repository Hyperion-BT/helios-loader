import { stripQuotes } from "./util"

const NAME_RE = /name:\s["]([a-zA-Z_]+)["]/
const DEP_RE = /dependencyInfo:\s(\{.*\})/
const SRC_RE = /\`[\s\S]*\`/gm

export type Dependencies = {[name: string]: string}

export class Module {
    #name: string
    #dependencies: Dependencies
    #src: string

    constructor(name: string, dependencies: Dependencies, src: string) {
        this.#name = name
        this.#dependencies = dependencies
        this.#src = src
    }

    get name(): string {
        return this.#name
    }

    get dependencies(): Dependencies {
        return this.#dependencies
    }

    get src(): string {
        return this.#src
    }

    stringify(): string {
        return (
`const m = {
    name: "${this.#name}",
    dependencyInfo: {${Object.keys(this.#dependencies).map(d => `"${d}": "${this.#dependencies[d]}"`).join(", ")}},
    dependencies: [${Object.keys(this.#dependencies).join(", ")}],
    src: \`${this.#src}\`
}

export { m as default }
`
        )
    }

    static parseName(m: string): string {
        const match = m.match(NAME_RE)

        if (match) {
            return match[1]
        } else {
            throw new Error("name not matched")
        }
    }

    static parseDependencies(m: string): Dependencies {
        const match = m.match(DEP_RE)

        if (match) {
            return JSON.parse(match[1])
        } else {
            console.log("HERE", m);
            throw new Error("dependencies not matched")
        }
    }

    static parseSrc(m: string): string {
        const match = m.match(SRC_RE)

		if (match && match.length == 1) {
			return stripQuotes(match[0])
		} else {
			throw new Error("internal error")
		}
    }

    static parse(m: string): Module {
        const name = Module.parseName(m)
        const dependencies = Module.parseDependencies(m)
        const src = Module.parseSrc(m)

        return new Module(name, dependencies, src)
    }
}