import command from "./command_test.ts"
import {help} from "./help.ts"

const result = help("Test Command", command)

console.log(result)
