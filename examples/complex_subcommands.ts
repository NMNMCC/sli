import {argument, command, option, parse} from "../mod.ts"

// Complex, nested subcommands with flags, options, aliases, and arguments.

const user = command({
	description: "User management",
	commands: {
		add: command({
			description: "Add a user",
			flags: {admin: {description: "Admin role", fallback: false}},
			options: {
				name: option({description: "User name", required: true}),
				email: option({description: "Email", required: true}),
				age: option({
					description: "Age",
					fallback: 0,
					transformer: (s: string) => parseInt(s, 10),
				}),
				tag: option({
					description: "Tag(s)",
					multiple: true,
					fallback: [],
				}),
			},
			alias: {options: {n: "name", e: "email", a: "age", t: "tag"}},
		}),
		delete: command({
			description: "Delete a user",
			flags: {
				confirm: {description: "Confirm deletion", fallback: false},
			},
			arguments: [
				argument({
					name: "id",
					description: "User ID",
					transformer: (s: string) => parseInt(s, 10),
				}),
			],
			alias: {flags: {y: "confirm"}},
		}),
		list: command({
			description: "List users",
			flags: {verbose: {description: "Verbose", fallback: false}},
			options: {
				filter: option({
					description: "Filter",
					multiple: true,
					fallback: [],
				}),
			},
			alias: {flags: {v: "verbose"}, options: {f: "filter"}},
		}),
	},
	alias: {commands: {a: "add", del: "delete", ls: "list"}},
})

const config = command({
	description: "Configuration",
	commands: {
		set: command({
			description: "Set a config value",
			options: {
				key: option({description: "Key", required: true}),
				value: option({description: "Value", required: true}),
			},
			alias: {options: {k: "key", v: "value"}},
		}),
		get: command({
			description: "Get a config value",
			arguments: [
				argument({
					name: "key",
					description: "Key",
				}),
			],
		}),
	},
	alias: {commands: {s: "set", g: "get"}},
})

const deploy = command({
	description: "Deploy project",
	commands: {
		prod: command({
			description: "Deploy to production",
			flags: {force: {description: "Force deploy", fallback: false}},
			options: {
				region: option({description: "Region", fallback: "us-east-1"}),
				tag: option({
					description: "Tags",
					multiple: true,
					fallback: [],
				}),
			},
			alias: {options: {r: "region", t: "tag"}, flags: {f: "force"}},
		}),
		staging: command({
			description: "Deploy to staging",
			options: {
				region: option({description: "Region", fallback: "us-west-2"}),
			},
			alias: {options: {r: "region"}},
		}),
	},
	alias: {commands: {p: "prod", s: "staging"}},
})

const project = command({
	description: "Project operations",
	commands: {
		create: command({
			description: "Create a project",
			flags: {private: {description: "Private repo", fallback: false}},
			options: {
				template: option({
					description: "Template",
					fallback: "default",
				}),
			},
			alias: {flags: {P: "private"}, options: {t: "template"}},
		}),
		deploy,
	},
	alias: {commands: {c: "create", d: "deploy"}},
})

const root = command({
	description: "Complex hierarchical CLI",
	commands: {user, config, project},
	alias: {commands: {u: "user", cfg: "config", p: "project"}},
})

const [path, data, cmd] = await parse(Deno.args, root)
console.log(path)
console.log(cmd.description ?? "")
console.log(JSON.stringify(data, null, 2))
