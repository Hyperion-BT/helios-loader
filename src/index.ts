import { HeliosLibrary, HeliosLoader } from "./HeliosLoader"
import { TypescriptLoader } from "./TypescriptLoader"
import { WebpackContext } from "./WebpackContext"

function isTypescript(ctx: WebpackContext) {
	const options = ctx.getOptions()

	if (ctx.resourcePath.endsWith(".ts") || ctx.resourcePath.endsWith(".tsx")) {
		return true
	} else if (ctx.loaders.some(l => l.path.includes("ts-loader") || l.path.includes("typescript-loader"))) {
		return true
	} else {
		return false
	}
}

export default function main(src: string) {
	const ctx: WebpackContext = this 

	const callback = ctx.async()

	if (isTypescript(ctx)) {
		const loader = new TypescriptLoader(ctx)

		loader.load(src).then((result) => {
			callback(null, result)
		}).catch((e) => {
			callback(new Error(`${this.resourcePath}: ${e.message}`))
		})
	} else {
		// use eval to import helios library, so that webpack doesn't convert 'import' into 'require'
		eval('import("@hyperionbt/helios")').then((helios: HeliosLibrary) => {
			const loader = new HeliosLoader(ctx, helios)

			loader.load(src).then((result) => {
				callback(null, result)
			}).catch((e) => {
				callback(new Error(`${this.resourcePath}: ${e.message}`))
			})
		})	
	}

	return undefined
}
