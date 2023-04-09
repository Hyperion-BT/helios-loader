import Program from "./contract.hl"

const program = new Program()

const uplcProgram = program.compile(true)

const hash = uplcProgram.validatorHash

console.log(hash.hex)
