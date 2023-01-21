export default function load(src) {
	return `
import { Program } from "@hyperionbt/helios"

export default class LazyProgram {
	#program;

	constructor() {
		const src = \`${src}\`;

		this.#program = Program.new(src);
	}

	compile(simplify = false) {
		return this.#program.compile(simplify);
	}
}`;
}
