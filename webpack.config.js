module.exports = {
	mode: "development",
	entry: "./src/index.ts",
	externals: "@hyperionbt/helios",
	target: "node",
	output: {
		path: __dirname + "/dist/",
		filename: "index.js",
		library: {
			type: "commonjs"
		},
		
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
					"ts-loader"
				]
		  	},
		]
	}
}