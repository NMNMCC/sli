import {command, option, parse} from "../mod.ts"

const app = command({
	description: "Options (required, fallback, transformers)",
	options: {
		count: option({
			description: "How many",
			fallback: 1,
			transformer: (s: string) => parseInt(s, 10),
		}),
		mode: option({description: "Mode", required: true}),
		tag: option({
			description: "Repeatable tag",
			multiple: true,
			fallback: [],
		}),
	},
	alias: {options: {c: "count", m: "mode", t: "tag"}},
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify(data.options, null, 2))
