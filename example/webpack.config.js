const path = require("path");

module.exports = {
	mode: "development",
	entry: "./index.js",
	output: {
		path: __dirname + "/dist/"
	},
	module: {
		rules: [
			{
				test: /\.hl$/,
				use: [
					{
						loader: path.resolve("../dist/index.js")
					}
				]
			}
		]
	}
}
