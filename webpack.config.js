module.exports = {
	mode: "development",
	entry: "./src/index.js",
	target: "node",
	output: {
		path: __dirname + "/dist/",
		filename: "index.js",
		library: {
			type: "commonjs"
		}
	}
}
