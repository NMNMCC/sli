import {command, option, parse} from "../mod.ts"

const app = command({
	description: "Options (required, parser, transformers)",
	options: {
		count: option({
			description: "How many",
			parser: (s?: string) => s ? parseInt(s, 10) : 1,
		}),
		mode: option({description: "Mode", required: true}),
		tag: option({
			description: "Repeatable tag",
			multiple: true,
			parser: (s?: string) => s ?? "",
		}),
	},
	alias: {options: {c: "count", m: "mode", t: "tag"}},
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify(data.options, null, 2))
