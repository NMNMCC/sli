import { command, parse } from "../mod.ts"

const run = command({
	description: "Run something",
	flags: { debug: { description: "Debug", fallback: false } },
})

const root = command({
	description: "Subcommands and aliases",
	commands: { run },
	alias: { commands: { r: "run" } },
})

const [path, data, cmd] = await parse(Deno.args, root)
console.log(path)
console.log(cmd.description ?? "")
console.log(JSON.stringify(data, null, 2))
