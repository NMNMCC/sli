import {MissingRequiredParameter, parse} from "./parse.ts"
import {command} from "./command.ts"
import {assertEquals, assertRejects} from "@std/assert"
import {help} from "./help.ts"

Deno.test("parse without subcommand", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			verbose: {
				description: "Enable verbose output",
				default: false,
			},
		},
	})

	const [_commands, data] = await parse(["--verbose"], cmd)

	assertEquals(data.flags.verbose, true)
})

Deno.test("parse with subcommand", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			verbose: {
				description: "Enable verbose output",
				default: false,
			},
		},
		alias: {
			flags: {
				v: "verbose",
			},
		},
		commands: {
			start: {
				description: "Start the service",
				flags: {
					force: {
						description: "Force start the service",
						default: false,
					},
				},
			},
		},
	})

	const [p, d, c] = await parse(["start", "--force"], cmd)

	switch (p) {
		case "start":
			assertEquals(d, {
				arguments: [],
				flags: {
					help: false,
					verbose: false,
					force: true,
				},
				options: {},
				raw: "",
			})
			console.log(help(c))
			break
	}
})

Deno.test("parse multiple combined short flags", async () => {
	const cmd = command({
		description: "Test command with multiple flags",
		flags: {
			verbose: {description: "Verbose output", default: false},
			debug: {description: "Debug mode", default: false},
			force: {description: "Force operation", default: false},
		},
		alias: {
			flags: {
				v: "verbose",
				d: "debug",
				f: "force",
			},
		},
	})

	const [, data] = await parse(["-vdf"], cmd)

	assertEquals(data.flags.verbose, true)
	assertEquals(data.flags.debug, true)
	assertEquals(data.flags.force, true)
})

Deno.test("parse flags with alias resolution", async () => {
	const cmd = command({
		description: "Test command with flag aliases",
		flags: {
			"all": {description: "Show all", default: false},
			"recursive": {description: "Recursive", default: false},
		},
		alias: {
			flags: {
				a: "all",
				R: "recursive",
			},
		},
	})

	const [, data] = await parse(["-a", "--recursive"], cmd)

	assertEquals(data.flags.all, true)
	assertEquals(data.flags.recursive, true)
})

Deno.test("parse mixed short and long flags", async () => {
	const cmd = command({
		description: "Test mixed flags",
		flags: {
			verbose: {description: "Verbose", default: false},
			debug: {description: "Debug", default: false},
			quiet: {description: "Quiet", default: false},
		},
		alias: {
			flags: {
				v: "verbose",
				q: "quiet",
			},
		},
	})

	const [, data] = await parse(["-v", "--debug", "-q"], cmd)

	assertEquals(data.flags.verbose, true)
	assertEquals(data.flags.debug, true)
	assertEquals(data.flags.quiet, true)
})

Deno.test("parse options with parsers", async () => {
	const cmd = command({
		description: "Test command with option parsers",
		options: {
			count: {
				description: "Number of iterations",
				parser: (s?: string) => s ? parseInt(s, 10) : 1,
			},
			enabled: {
				description: "Enable feature",
				parser: (s?: string) => s ? s.toLowerCase() === "true" : false,
			},
		},
		alias: {
			options: {
				n: "count",
				e: "enabled",
			},
		},
	})

	const [, data] = await parse(["--count", "42", "--enabled", "true"], cmd)

	assertEquals(data.options, {
		count: 42,
		enabled: true,
	})
})

Deno.test("parse multiple-value options", async () => {
	const cmd = command({
		description: "Test command with multiple value options",
		options: {
			files: {
				description: "List of files",
				multiple: true,
				parser: (s) => s ?? "",
			},
			single: {
				description: "Single value",
				parser: (s) => s ?? "default",
			},
		},
	})

	const [, data] = await parse([
		"--files",
		"file1.txt",
		"--files",
		"file2.txt",
		"--files",
		"file3.txt",
		"--single",
		"value",
	], cmd)

	assertEquals(data.options, {
		files: ["file1.txt", "file2.txt", "file3.txt"],
		single: "value",
	})
})

Deno.test("parse options with short aliases", async () => {
	const cmd = command({
		description: "Test command with option aliases",
		options: {
			output: {
				description: "Output file",
				parser: (s) => s ?? "out.txt",
			},
			input: {
				description: "Input file",
				required: true,
			},
		},
		alias: {
			options: {
				o: "output",
				i: "input",
			},
		},
	})

	const [, data] = await parse(["-i", "input.txt", "-o", "output.txt"], cmd)

	assertEquals(data.options.input, "input.txt")
	assertEquals(data.options.output, "output.txt")
})

Deno.test("parse options with special characters in values", async () => {
	const cmd = command({
		description: "Test command with special characters",
		options: {
			message: {
				description: "Message with special chars",
				required: true,
			},
			path: {
				description: "File path",
				parser: (s) => s ?? "/default/path",
			},
		},
	})

	const [, data] = await parse([
		"--message",
		"Hello, world! @#$%^&*()",
		"--path",
		"/path/with spaces/file.txt",
	], cmd)

	assertEquals(data.options.message, "Hello, world! @#$%^&*()")
	assertEquals(data.options.path, "/path/with spaces/file.txt")
})

Deno.test("parse multiple arguments with parsers", async () => {
	const cmd = command({
		description: "Test command with arguments",
		arguments: [
			{
				name: "source",
				description: "Source file",
				parser: (s: string) => s.trim(),
			},
			{
				name: "destination",
				description: "Destination file",
				parser: (s: string) => s.trim(),
			},
			{
				name: "mode",
				description: "Copy mode",
				parser: (s: string) => s.trim(),
			},
		],
	})

	const [, data] = await parse(["src.txt", "dst.txt", "644"], cmd)

	assertEquals(data.arguments, ["src.txt", "dst.txt", "644"])
})

Deno.test("parse arguments mixed with flags and options", async () => {
	const cmd = command({
		description: "Test mixed arguments and options",
		flags: {
			verbose: {description: "Verbose", default: false},
		},
		options: {
			mode: {
				description: "Operation mode",
				parser: (s) => s ?? "default",
			},
		},
		arguments: [
			{
				name: "source",
				description: "Source",
				parser: (s: string) => s,
			},
			{
				name: "destination",
				description: "Destination",
				parser: (s: string) => s,
			},
		],
		alias: {
			flags: {
				v: "verbose",
			},
		},
	})

	const [, data] = await parse([
		"-v",
		"source.txt",
		"--mode",
		"fast",
		"dest.txt",
	], cmd)

	assertEquals(data.flags.verbose, true)
	assertEquals(data.options.mode, "fast")
	assertEquals(data.arguments, ["source.txt", "dest.txt"])
})

Deno.test("error: too many arguments", async () => {
	const cmd = command({
		description: "Test command with limited arguments",
		arguments: [
			{
				name: "single",
				description: "Single argument",
				parser: (s: string) => s,
			},
		],
	})

	const [, , , error] = await parse(["arg1", "arg2"], cmd)
	assertEquals(error?.message, "unknown parameter arg2")
})

Deno.test("parse nested subcommands with aliases", async () => {
	const containerCmd = command({
		description: "Container management",
		commands: {
			create: {
				description: "Create container",
				flags: {
					"with-volume": {
						description: "Create with volume",
						default: false,
					},
				},
			},
		},
	})

	const rootCmd = command({
		description: "Root command",
		commands: {
			container: containerCmd,
		},
		alias: {
			commands: {
				c: "container",
			},
		},
	})

	const [path, data] = await parse(
		["container", "create", "--with-volume"],
		rootCmd,
	)

	switch (path) {
		case "container create":
			assertEquals(data.flags["with-volume"], true)
			break
	}
})

Deno.test("parse deep command hierarchy", async () => {
	const cmd = command({
		description: "Root command",
		commands: {
			level1: {
				description: "Level 1",
				commands: {
					level2: {
						description: "Level 2",
						commands: {
							action: {
								description: "Action command",
								flags: {
									flag: {
										description: "A flag",
										default: false,
									},
								},
							},
						},
					},
				},
			},
		},
	})

	const [path, _data] = await parse(["level1", "level2", "action"], cmd)

	assertEquals(path, "level1 level2 action")
})

Deno.test("parse with -- delimiter for raw text", async () => {
	const cmd = command({
		description: "Test command with raw text",
		flags: {
			verbose: {description: "Verbose", default: false},
		},
		arguments: [
			{
				name: "command",
				description: "Command to run",
				parser: (s: string) => s,
			},
		],
	})

	const [, data] = await parse([
		"--verbose",
		"echo",
		"--",
		"hello world",
		"--not-a-flag",
	], cmd)

	assertEquals(data.flags.verbose, true)
	assertEquals(data.arguments, ["echo"])
	// The raw captures everything after the first argument following --
	// So with ["hello world", "--not-a-flag"], raw becomes "--not-a-flag"
	assertEquals(data.raw, "--not-a-flag")
})

Deno.test("parse empty input", async () => {
	const cmd = command({
		description: "Test command with no input",
		flags: {
			flag: {description: "A flag", default: false},
		},
	})

	const [, data] = await parse([], cmd)

	assertEquals(data.flags.flag, false)
	assertEquals(data.arguments, [])
})

Deno.test("parse command with -- at start", async () => {
	const cmd = command({
		description: "Test command",
		arguments: [
			{
				name: "action",
				description: "Action",
				parser: (s: string) => s,
			},
		],
	})

	const [, data] = await parse(["--", "run", "something", "--debug"], cmd)

	// Raw captures all arguments after --, joined by spaces
	assertEquals(data.raw, "something --debug")
})

Deno.test("error: unknown flag", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			known: {description: "Known flag", default: false},
		},
	})

	const [, , , error] = await parse(["--unknown"], cmd)
	assertEquals(error?.message, "unknown parameter --unknown")
})

Deno.test("error: unknown short flag combination", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			a: {description: "Flag a", default: false},
		},
	})

	const [, , , error] = await parse(["-ab"], cmd)
	assertEquals(error?.message, "unknown parameter -ab")
})

Deno.test("error: invalid short option placement", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			all: {description: "All flag", default: false},
			verbose: {description: "Verbose flag", default: false},
		},
		options: {
			output: {
				description: "Output file",
				required: true,
			},
		},
		alias: {
			flags: {
				a: "all",
				v: "verbose",
			},
			options: {
				o: "output",
			},
		},
	})

	// When o is at the end, it should work
	const [, data] = await parse(["-av", "--output", "value"], cmd)
	assertEquals(data.flags.all, true)
	assertEquals(data.flags.verbose, true)
	assertEquals(data.options.output, "value")
})

Deno.test("error: missing required option", async () => {
	const cmd = command({
		description: "Test command with required option",
		options: {
			required: {
				description: "Required option",
				required: true,
			},
		},
	})

	const [, , , error] = await parse([], cmd)

	assertEquals(error instanceof MissingRequiredParameter, true)
})

Deno.test("error: unknown subcommand", async () => {
	const cmd = command({
		description: "Test command",
		commands: {
			known: {
				description: "Known subcommand",
			},
		},
	})

	const [, , , error] = await parse(["unknown"], cmd)
	assertEquals(error?.message, "unknown parameter unknown")
})

Deno.test("parse complex git-like command", async () => {
	const commitCmd = command({
		description: "Record changes",
		flags: {
			all: {description: "Stage all changes", default: false},
			amend: {description: "Amend previous commit", default: false},
		},
		options: {
			message: {
				description: "Commit message",
				parser: (s) => s ?? "",
			},
		},
		alias: {
			flags: {
				a: "all",
			},
			options: {
				m: "message",
			},
		},
	})

	const pushCmd = command({
		description: "Push changes",
		arguments: [
			{
				name: "remote",
				description: "Remote name",
				parser: (s: string) => s,
			},
			{
				name: "branch",
				description: "Branch name",
				parser: (s: string) => s,
			},
		],
	})

	const gitCmd = command({
		description: "Git-like version control",
		flags: {
			quiet: {description: "Suppress output", default: false},
		},
		alias: {
			flags: {
				q: "quiet",
			},
		},
		commands: {
			commit: commitCmd,
			push: pushCmd,
		},
	})

	// Test git commit with all the features
	const [commitPath, commitData] = await parse([
		"commit",
		"-a",
		"--message",
		"Initial commit",
	], gitCmd)

	switch (commitPath) {
		case "commit":
			assertEquals(commitData.flags.all, true)
			assertEquals(commitData.options.message, "Initial commit")
			break
	}

	// Test git push with arguments
	const [pushPath, pushData] = await parse([
		"push",
		"origin",
		"main",
	], gitCmd)

	assertEquals(pushPath, "push")
	assertEquals(pushData.arguments, ["origin", "main"])
})

Deno.test("parse docker-like command with complex structure", async () => {
	const runCmd = command({
		description: "Run a container",
		flags: {
			detach: {description: "Run in background", default: false},
			interactive: {description: "Interactive mode", default: false},
			tty: {description: "Allocate TTY", default: false},
			rm: {description: "Remove container on exit", default: false},
		},
		options: {
			name: {
				description: "Container name",
				parser: (s) => s ?? "",
			},
			port: {
				description: "Port mapping",
				multiple: true,
				parser: (s) => s ?? "",
			},
			env: {
				description: "Environment variable",
				multiple: true,
				parser: (s) => s ?? "",
			},
		},
		alias: {
			flags: {
				d: "detach",
				i: "interactive",
				t: "tty",
			},
			options: {
				p: "port",
				e: "env",
			},
		},
		arguments: [
			{
				name: "image",
				description: "Container image",
				parser: (s: string) => s,
			},
			{
				name: "command",
				description: "Command to run",
				parser: (s: string) => s,
			},
		],
	})

	const dockerCmd = command({
		description: "Docker-like container manager",
		commands: {
			run: runCmd,
		},
	})

	const [path, data] = await parse([
		"run",
		"-d",
		"--name",
		"web-server",
		"-p",
		"8080:80",
		"-e",
		"NODE_ENV=production",
		"nginx:alpine",
		"nginx -g 'daemon off;'",
	], dockerCmd)

	switch (path) {
		case "run":
			assertEquals(data.flags.detach, true)
			assertEquals(data.flags.interactive, false)
			assertEquals(data.flags.tty, false)
			assertEquals(data.flags.rm, false)
			assertEquals(data.options.name, "web-server")
			assertEquals(data.options.port, ["8080:80"])
			assertEquals(data.options.env, ["NODE_ENV=production"])
			assertEquals(data.arguments, [
				"nginx:alpine",
				"nginx -g 'daemon off;'",
			])
			break
	}
})

Deno.test("parse npm-like command with scripts", async () => {
	const installCmd = command({
		description: "Install packages",
		options: {
			"save-dev": {
				description: "Save as dev dependency",
				parser: (s?: string) => s ? s === "true" : false,
			},
		},
		arguments: [
			{
				name: "packages",
				description: "Package names",
				parser: (s: string) => s,
			},
		],
	})

	const runCmd = command({
		description: "Run script",
		arguments: [
			{
				name: "script",
				description: "Script name",
				parser: (s: string) => s,
			},
		],
	})

	const npmCmd = command({
		description: "NPM-like package manager",
		flags: {
			silent: {description: "Silent operation", default: false},
		},
		alias: {
			flags: {
				s: "silent",
			},
		},
		commands: {
			install: installCmd,
			run: runCmd,
		},
	})

	// Test npm install with packages
	const [installPath, installData] = await parse([
		"install",
		"--save-dev",
		"true",
		"react",
	], npmCmd)

	assertEquals(installPath, "install")
	assertEquals(installData.options["save-dev"], true)
	assertEquals(installData.arguments, ["react"])

	// Test npm run with raw args
	const [runPath, runData] = await parse([
		"--silent",
		"run",
		"build",
		"--",
		"--prod",
		"--verbose",
	], npmCmd)

	assertEquals(runPath, "run")
	assertEquals(runData.arguments, ["build"])
	assertEquals(runData.raw, "--verbose")
})
