import {command, parse} from "../mod.ts"

const app = command({
	description: "Short aliases: combined flags and a short option",
	flags: {
		all: {description: "All", default: false},
		verbose: {description: "Verbose", default: false},
	},
	options: {output: {description: "Output file", required: true}},
	alias: {flags: {a: "all", v: "verbose"}, options: {o: "output"}},
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify(data, null, 2))
