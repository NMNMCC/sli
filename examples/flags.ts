import { command, parse } from "../mod.ts"

const app = command({
	description: "Flags with aliases",
	flags: {
		verbose: { description: "Verbose output", fallback: false },
		force: { description: "Force", fallback: false },
	},
	alias: { flags: { v: "verbose", f: "force" } },
})

const [, data] = await parse(Deno.args, app)
console.log(JSON.stringify(data.flags, null, 2))
