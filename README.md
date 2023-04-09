# Helios Webpack loader

This [Webpack](https://webpack.js.org/) loader allows importing Helios scripts directly into Javascript/Typescript projects.

Features:
* Helios compilation is run during build time
* Working with Helios sources directly allows using Helios IDE plugins
* The Helios library is a peer dependency of this loader, so this loader automatically uses your current version of Helios
* WiP: generates Typescript declarations for user-defined Helios types (Typescript declaration files are emitted inside the source directory)

Note: the Helios import syntax must use relative paths as literal strings insteads of module names.

## Example

A Helios module:
```
// common.hl
module common

struct Datum {
    secret: Int
}

struct Redeemer {
    guess: Int
}
```

A Helios validator:
```
// contract.hl
spending contract 

import { Datum, Redeemer } from "./common.hl"

func main(datum: Datum, redeemer: Redeemer, _) -> Bool {
    datum.secret == redeemer.guess
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

Install the loader:
```
npm install --save-dev @hyperionbt/helios-loader
```

If *npm* gives the `unable to resolve dependency tree` error, you can try running the following command to force *npm* to use your currently installed Helios 
version:
```
npm install --save-dev @hyperionbt/helios-loader --legacy-peer-deps
```

Configure Webpack:
```js
// webpack.config.js
module.exports = {
	mode: "development",
	entry: "./index.ts",
	output: {
		path: __dirname + "/dist/"
	},
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
					"@hyperionbt/helios-loader" // helios-loader AFTER ts-loader so it is able to modify .ts sources importing Helios scripts BEFORE ts-loader is called
				]
		  	},
			{
				test: /\.(hl|helios)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "@hyperionbt/helios-loader",
						options: {
							emitTypes: true // must be true when importing Helios scripts in Typescript
						}
					}
				]
			}
		]
	}
}
```