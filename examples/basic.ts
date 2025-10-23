import {argument, command, option, parse} from "../mod.ts"

const app = command({
	description: "Minimal example: one argument and one option.",
	arguments: [
		argument({
			name: "name",
			description: "Your name",
			transformer: (s: string) => s,
		}),
	],
	options: {
		times: option({
			description: "Repeat times",
			parser: (s?: string) => s ? parseInt(s, 10) : 1,
		}),
	},
})

const [path, data] = await parse(Deno.args, app)
console.log(path)
console.log(JSON.stringify(data, null, 2))
