import {help} from "./help.ts"
import {command} from "./command.ts"
import {assertEquals, assertStringIncludes} from "@std/assert"

Deno.test("help generates output for command with all sections", () => {
	const cmd = command({
		description: "A comprehensive command",
		commands: {
			run: command({description: "Run something"}),
		},
		flags: {
			verbose: {description: "Verbose output", fallback: false},
		},
		options: {
			input: {description: "Input file", required: true},
			output: {description: "Output file", fallback: "out.txt"},
		},
		arguments: [
			{
				name: "path",
				description: "Working directory",
				transformer: (s: string) => s,
			},
		],
		alias: {
			commands: {r: "run"},
			flags: {v: "verbose"},
			options: {i: "input", o: "output"},
		},
	})

	const result = help("myapp", cmd)

	assertStringIncludes(result, "myapp")
	assertStringIncludes(result, "A comprehensive command")
	assertStringIncludes(result, "Commands:")
	assertStringIncludes(result, "run, r")
	assertStringIncludes(result, "Flags:")
	assertStringIncludes(result, "--verbose, -v")
	assertStringIncludes(result, "Options:")
	assertStringIncludes(result, "--input, -i")
	assertStringIncludes(result, "<required>")
	assertStringIncludes(result, "--output, -o")
	assertStringIncludes(result, "[default: out.txt]")
	assertStringIncludes(result, "Arguments:")
	assertStringIncludes(result, "<path>")
})

Deno.test("help handles empty command", () => {
	const cmd = command({})
	const result = help("simple", cmd)
	assertEquals(result, "simple\n\n")
})

Deno.test("help with only description", () => {
	const cmd = command({description: "Just a description"})
	const result = help("desc", cmd)
	assertEquals(result, "desc\nJust a description\n\n")
})
