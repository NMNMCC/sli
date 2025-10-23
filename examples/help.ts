import { command, argument, option } from "../mod.ts"
import { help } from "../src/help.ts"

const app = command({
	description: "Demo app to show generated help",
	commands: { run: command({ description: "Run task" }) },
	flags: { verbose: { description: "Verbose mode", fallback: false } },
	options: { count: option({ description: "How many", fallback: 1 }) },
	alias: { commands: { r: "run" }, flags: { v: "verbose" }, options: { n: "count" } },
	arguments: [argument({ name: "target", description: "Target name", transformer: (s: string) => s })],
})

console.log(help("myapp", app))
