import {argument, command, flag, help, option, parse} from "../mod.ts"

const app = command({
	description: `Quick Starter
a simple quick starter app`,
	flags: {
		verbose: flag({
			description: "3x more!!!",
			default: false,
		}),
	},
	options: {
		name: option({required: true}),
	},
	arguments: [
		argument({
			name: "whatever",
		}),
	],
	alias: {
		commands: {
			h: "hello",
			g: "goodbye",
		},
		flags: {
			v: "verbose",
		},
	},
	commands: {
		hello: command({
			description: "say hello",
		}),
		goodbye: command({
			description: "say goodbye",
			options: {
				"next-time": option({
					description: "when will we meet again?",
					parser: (i) => new Date(i ?? 0),
				}),
			},
		}),
	},
})

const [path, data, cmd, error] = await parse(Deno.args, app)

if (error) {
	console.log(help(cmd))
	throw error
}

for (let i = 0; (i < (data.flags.verbose ? 3 : 1)); i++) {
	switch (path) {
		case "hello":
			console.log(
				`Hello ${data.options.name}! ${data.arguments[0] ?? ""}`,
			)
			break
		case "goodbye":
			console.log(
				`Goodbye ${data.options.name}! See you next time at ${
					data.options["next-time"]
				}! ${data.arguments[0] ?? ""}`,
			)
			break
		default:
			console.log(help(cmd))
	}
}
