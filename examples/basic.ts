import { command, argument, option, parse } from "../mod.ts"

const app = command({
	description: "Minimal example: one argument and one option.",
	arguments: [
		argument({ name: "name", description: "Your name", transformer: (s: string) => s }),
	],
	options: {
		times: option({ description: "Repeat times", fallback: 1, transformer: (s: string) => parseInt(s, 10) }),
	},
})

const [path, data] = await parse(Deno.args, app)
console.log(path)
console.log(JSON.stringify(data, null, 2))
