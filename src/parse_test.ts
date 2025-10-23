import {parse} from "./parse.ts"
import {command} from "./command.ts"
import {assertEquals, assertRejects} from "@std/assert"
import {help} from "./help.ts"

Deno.test("parse without subcommand", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			verbose: {
				description: "Enable verbose output",
				fallback: false,
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
				fallback: false,
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
						fallback: false,
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
					force: true,
				},
				options: {},
				raw: "",
			})
			console.log(help("test", c))
			break
	}
})

Deno.test("parse multiple combined short flags", async () => {
	const cmd = command({
		description: "Test command with multiple flags",
		flags: {
			verbose: {description: "Verbose output", fallback: false},
			debug: {description: "Debug mode", fallback: false},
			force: {description: "Force operation", fallback: false},
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
			"all": {description: "Show all", fallback: false},
			"recursive": {description: "Recursive", fallback: false},
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
			verbose: {description: "Verbose", fallback: false},
			debug: {description: "Debug", fallback: false},
			quiet: {description: "Quiet", fallback: false},
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

Deno.test("parse options with transformers", async () => {
	const cmd = command({
		description: "Test command with option transformers",
		options: {
			count: {
				description: "Number of iterations",
				fallback: 1,
				transformer: parseInt,
			},
			enabled: {
				description: "Enable feature",
				fallback: false,
				transformer: (s: string) => s.toLowerCase() === "true",
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
				fallback: [],
			},
			single: {
				description: "Single value",
				fallback: "default",
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
				fallback: "out.txt",
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
				fallback: "/default/path",
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

Deno.test("parse multiple arguments with transformers", async () => {
	const cmd = command({
		description: "Test command with arguments",
		arguments: [
			{
				name: "source",
				description: "Source file",
				transformer: (s: string) => s.trim(),
			},
			{
				name: "destination",
				description: "Destination file",
				transformer: (s: string) => s.trim(),
			},
			{
				name: "mode",
				description: "Copy mode",
				transformer: (s: string) => s.trim(),
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
			verbose: {description: "Verbose", fallback: false},
		},
		options: {
			mode: {
				description: "Operation mode",
				fallback: "default",
			},
		},
		arguments: [
			{
				name: "source",
				description: "Source",
				transformer: (s: string) => s,
			},
			{
				name: "destination",
				description: "Destination",
				transformer: (s: string) => s,
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
				transformer: (s: string) => s,
			},
		],
	})

	await assertRejects(
		() => parse(["arg1", "arg2"], cmd),
		Error,
		"unknown parameter arg2",
	)
})

// ===== COMMAND NAVIGATION WITH ALIASES =====

Deno.test("parse nested subcommands with aliases", async () => {
	const containerCmd = command({
		description: "Container management",
		commands: {
			create: {
				description: "Create container",
				flags: {
					"with-volume": {
						description: "Create with volume",
						fallback: false,
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
										fallback: false,
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

// ===== SPECIAL PARSING SCENARIOS =====

Deno.test("parse with -- delimiter for raw text", async () => {
	const cmd = command({
		description: "Test command with raw text",
		flags: {
			verbose: {description: "Verbose", fallback: false},
		},
		arguments: [
			{
				name: "command",
				description: "Command to run",
				transformer: (s: string) => s,
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
			flag: {description: "A flag", fallback: false},
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
				transformer: (s: string) => s,
			},
		],
	})

	const [, data] = await parse(["--", "run", "something", "--debug"], cmd)

	// Raw captures all arguments after --, joined by spaces
	assertEquals(data.raw, "something --debug")
})

// ===== ERROR CONDITIONS =====

Deno.test("error: unknown flag", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			known: {description: "Known flag", fallback: false},
		},
	})

	await assertRejects(
		() => parse(["--unknown"], cmd),
		Error,
		"unknown parameter --unknown",
	)
})

Deno.test("error: unknown short flag combination", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			a: {description: "Flag a", fallback: false},
		},
	})

	await assertRejects(
		() => parse(["-ab"], cmd),
		Error,
		"unknown parameter -ab",
	)
})

Deno.test("error: invalid short option placement", async () => {
	const cmd = command({
		description: "Test command",
		flags: {
			all: {description: "All flag", fallback: false},
			verbose: {description: "Verbose flag", fallback: false},
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

	await assertRejects(
		() => parse([], cmd),
		Error,
		"missing required parameter required",
	)
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

	await assertRejects(
		() => parse(["unknown"], cmd),
		Error,
		"unknown parameter unknown",
	)
})

// ===== COMPLEX REAL-WORLD SCENARIOS =====

Deno.test("parse complex git-like command", async () => {
	const commitCmd = command({
		description: "Record changes",
		flags: {
			all: {description: "Stage all changes", fallback: false},
			amend: {description: "Amend previous commit", fallback: false},
		},
		options: {
			message: {
				description: "Commit message",
				fallback: "",
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
				transformer: (s: string) => s,
			},
			{
				name: "branch",
				description: "Branch name",
				transformer: (s: string) => s,
			},
		],
	})

	const gitCmd = command({
		description: "Git-like version control",
		flags: {
			quiet: {description: "Suppress output", fallback: false},
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
			detach: {description: "Run in background", fallback: false},
			interactive: {description: "Interactive mode", fallback: false},
			tty: {description: "Allocate TTY", fallback: false},
			rm: {description: "Remove container on exit", fallback: false},
		},
		options: {
			name: {
				description: "Container name",
				fallback: "",
			},
			port: {
				description: "Port mapping",
				multiple: true,
				fallback: [],
			},
			env: {
				description: "Environment variable",
				multiple: true,
				fallback: [],
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
				transformer: (s: string) => s,
			},
			{
				name: "command",
				description: "Command to run",
				transformer: (s: string) => s,
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
				fallback: false,
				transformer: (s: string) => s === "true",
			},
		},
		arguments: [
			{
				name: "packages",
				description: "Package names",
				transformer: (s: string) => s,
			},
		],
	})

	const runCmd = command({
		description: "Run script",
		arguments: [
			{
				name: "script",
				description: "Script name",
				transformer: (s: string) => s,
			},
		],
	})

	const npmCmd = command({
		description: "NPM-like package manager",
		flags: {
			silent: {description: "Silent operation", fallback: false},
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
