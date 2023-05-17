const path = require("path");

const prod = false

module.exports = {
	mode: prod ? "production" : "development",
	entry: "./src/index.ts",
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
					"@hyperionbt/helios-loader"
				]
		  	},
			{
				test: /\.(hl|helios)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "@hyperionbt/helios-loader",
						options: {
							emitTypes: true
						}
					}
				]
			}
		]
	}
}
