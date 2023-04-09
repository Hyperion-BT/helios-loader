import { join as joinPath } from "path"

import { AsyncLoader } from "./AsyncLoader"
import { Module } from "./Module"
import { WebpackContext } from "./WebpackContext"

const IMPORT_RE = /(import\s*(\S+)?\s*from\s*["'])([^"']+\.hl)(["'])/gm

export class TypescriptLoader extends AsyncLoader {
    constructor(ctx: WebpackContext) {
        super(ctx)
    }

    async load(src: string): Promise<string> {
        const matches = Array.from(src.matchAll(IMPORT_RE))

        for (let m of matches) {
            const hlPath = joinPath(this.currentDir, m[3])

            const content = await this.readFile(hlPath)

            if (content.startsWith("const m")) {
                const m = Module.parse(content)

                throw new Error(`can't import Helios module "${m.name}" directly into "${this.currentFile}"`)
            }
        }

        return src
    }
}