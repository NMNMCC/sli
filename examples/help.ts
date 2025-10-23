import {argument, command, option} from "../mod.ts"
import {help} from "../mod.ts"

const app = command({
	description: "Demo app to show generated help",
	commands: {run: command({description: "Run task"})},
	flags: {verbose: {description: "Verbose mode", default: false}},
	options: {
		count: option({
			description: "How many",
			parser: (s?: string) => s ? Number(s) : 1,
		}),
	},
	alias: {commands: {r: "run"}, flags: {v: "verbose"}, options: {n: "count"}},
	arguments: [
		argument({
			name: "target",
			description: "Target name",
			transformer: (s: string) => s,
		}),
	],
})

console.log(help(app))
