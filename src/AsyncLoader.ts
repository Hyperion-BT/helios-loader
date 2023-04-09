import { LoaderOptions } from "./LoaderOptions"
import { WebpackContext } from "./WebpackContext";

export class AsyncLoader {
    #ctx: WebpackContext

    constructor(ctx: WebpackContext) {
        this.#ctx = ctx
    }

	get currentDir(): string {
		return this.#ctx.context
	}

    get currentFile(): string {
        return this.#ctx.resourcePath
    }

    get options(): LoaderOptions {
        return this.#ctx.getOptions()
    }

    get queryParams(): string {
        console.log(this.#ctx.request)
        return this.#ctx.resourceQuery
    }

    // calc abs path
	resolve(relPath: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.#ctx.resolve(this.currentDir, relPath, (e, result) => {
				if (e) {
					reject(e)
                } else if (result) {
                    resolve(result)
				} else {
                    reject(new Error("unexpected"))
				}
			})
		})
	}

    readFile(p: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.#ctx.loadModule(p, (e, result) => {
                if (e) {
                    reject(e)
                } else {
                    resolve(result)
                }
            })
        })
    }
}