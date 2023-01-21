import Program from "./contract.hl";

const program = new Program()

const hash = program.compile(true).validatorHash;

console.log(hash.hex)
