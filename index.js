import * as path from "path"
import * as helios from "@hyperionbt/helios"

/**
 * Called for every .hl file
 * @param {string} raw 
 * @returns {string}
 */
modules.default = function load(raw) {
	const fs = this.fs.fileSystem;
	const srcPath = this.resourcePath;
	const dirPath = path.dirname(srcPath);

	if (raw.trim().startsWith("module")) {
		// throw an error if trying to import module from non-helios file

		return loadModule.bind(this)(raw)
	} else {
		return loadScript.bind(this)(raw)
	}
}

/**
 * @param {string} raw 
 * @returns {string}
 */
function loadModule(raw) {
	return `export const test = '${raw}'`
}

/**
 * @param {string} raw 
 * @returns {string}
 */
function loadScript(raw) {
	return `export const test = '${raw}'`
}
