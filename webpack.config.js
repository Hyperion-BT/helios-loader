module.exports = {
	mode: "production",
	entry: "./src/index.js",
	output: {
		path: __dirname + "/dist/",
		filename: "index.js",
		library: {
			type: "commonjs"
		}
	}
}
