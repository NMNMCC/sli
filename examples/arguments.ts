import {argument, command, parse} from "../mod.ts"

const app = command({
	description: "Positional arguments",
	arguments: [
		argument({
			name: "src",
			description: "Source path",
			transformer: (s: string) => s,
		}),
		argument({
			name: "dst",
			description: "Destination path",
			transformer: parseFloat,
		}),
	],
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify(data.arguments, null, 2))
