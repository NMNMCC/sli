import {parse} from "./parse.ts"
import {command} from "./command.ts"
import {assertEquals} from "@std/assert"
import {help} from "./help.ts"

Deno.test("parse without subcommand", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			verbose: {
				description: "Enable verbose output",
				fallback: false,
			},
		},
	})

	const [_commands, data] = await parse(["--verbose"], cmd)

	assertEquals(data.flags.verbose, true)
})

Deno.test("parse with subcommand", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			verbose: {
				description: "Enable verbose output",
				fallback: false,
			},
		},
		commands: {
			start: {
				description: "Start the service",
				flags: {
					force: {
						description: "Force start the service",
						fallback: false,
					},
				},
			},
		},
	})

	const [p, d, c] = await parse(["start", "--force"], cmd)

	switch (p) {
		case "start":
			assertEquals(d.flags.force, true)
			console.log(help("test", c))
			break
	}
})
