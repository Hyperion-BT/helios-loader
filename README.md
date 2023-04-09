# Helios Webpack loader

This [Webpack](https://webpack.js.org/) loader allows importing Helios scripts directly into Javascript/Typescript projects.

Features:
* Helios compilation is run during build time
* Working with Helios sources directly allows using Helios IDE plugins
* The Helios library is a peer dependency of this loader, so this loader automatically uses your current version of Helios
* WiP: generate Typescript declarations for user-defined Helios types

Note: the Helios import syntax must use relative paths as literal strings insteads of module names.

Note: Typescript declaration files are emitted inside the source directory

## Example

A Helios module:
```
// common.hl
module common

struct Redeemer {
    a: Int
}

struct Datum {
    a: Int
}
```

A Helios validator:
```
// contract.hl
spending contract 

import { Datum, Redeemer } from "./my_module.hl"

func main(d: Datum, r: Redeemer, _) -> Bool {
    d.a == r.a
}
```

Typescript off-chain code:
```ts
// index.ts
import Program from "./contract.hl"

const program = new Program()

const uplcProgram = program.compile(true)

...
```

## Installation and configuration

Installation:

```
npm install --save-dev @hyperionbt/helios-loader
```

Webpack configuration:

```js
module.exports = {
	...
	module: {
		rules: [
		  	{
				test: /(?<!\.d)\.(ts|tsx)$/,
				exclude: /node_modules/,
				resolve: {
			  		extensions: [".ts", ".tsx"],
				},
				use: [
					"ts-loader",
					"@hyperionbt/helios-loader" // helios-loader AFTER ts-loader so it is able to modify .ts sources BEFORE ts-loader
				]
		  	},
			{
				test: /\.(hl|helios)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: path.resolve("./loader.js"),
						options: {
							emitTypes: true // must be true when imporing in typescript
						}
					}
				]
			}
		]
	}
}
```