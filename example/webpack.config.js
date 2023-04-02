const path = require("path");

module.exports = {
	mode: "development",
	entry: "./src/index.ts",
	output: {
		path: __dirname + "/dist/"
	},
	module: {
		rules: [
			{
				test: /\.hl$/,
				exclude: /node_modules/,
				use: [
					{
						loader: path.resolve("../dist/index.js")
					}
				]
			},
		  	{
				test: /(?<!\.d)\.(ts|tsx)$/,
				exclude: /node_modules/,
				resolve: {
			  		extensions: [".ts", ".tsx"],
				},
				use: [
					"ts-loader"
				]
		  	}
		]
	}
}
