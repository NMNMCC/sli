import {help} from "./help.ts"
import {command} from "./command.ts"
import {assertEquals} from "@std/assert"

Deno.test("help handles empty command", () => {
	const cmd = command({})
	const result = help(cmd)
	assertEquals(result, "\n\n")
})

Deno.test("help with only description", () => {
	const cmd = command({description: "Just a description"})
	const result = help(cmd)
	assertEquals(result, "Just a description\n\n")
})
