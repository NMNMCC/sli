import {argument, command, parse} from "../mod.ts"

const app = command({
	description: "Use -- to pass raw args through",
	flags: {verbose: {description: "Verbose", default: false}},
	arguments: [
		argument({
			name: "cmd",
			description: "Command",
			transformer: (s: string) => s,
		}),
	],
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify({arguments: data.arguments, raw: data.raw}, null, 2))
