import {type Command, command} from "./command.ts"
import type {CommandResultEntry, InferCommands} from "./result.ts"
import {type Merge, merge} from "./util.ts"
import minimist from "minimist"

class UnknownParameter extends Error {
	constructor(parameter: string) {
		super(`unknown parameter ${parameter}`)
	}
}

const helper = command({
	flags: {
		help: {
			description: "Display help information about the command",
			fallback: false,
		},
	},
})

export const parse = async <const TCommand extends Command>(
	argv: string[],
	cmd: TCommand,
): Promise<
	CommandResultEntry<
		InferCommands<
			Merge<
				typeof helper,
				TCommand
			>
		>
	>
> => {
	const result: {
		flags: Record<string, boolean>
		options: Record<string, unknown | unknown[]>
		arguments: unknown[]
		raw: string
	} = {
		flags: {},
		options: {},
		arguments: [],
		raw: "",
	}

	const commands: string[] = []
	let c: Command = merge(helper, cmd)
	for (let i = 0; i < argv.length; i++) {
		const is = (type: "flags" | "options" | "commands", key: string) =>
			!c[type] ? false : Object.keys(c[type]).includes(key)
		const expand = (
			type: "flags" | "options" | "commands",
			short: string,
		): string | undefined => c.alias?.[type]?.[short]

		const arg = argv[i]

		if (arg === "--") {
			result.raw = argv.slice(i).join(" ")
			break
		}

		if (arg[0] === "-") {
			const alias: Record<string, string[] | string> = {}
			const booleans: string[] = []
			const strings: string[] = []

			if (c.flags) {
				for (const k of Object.keys(c.flags)) {
					booleans.push(k)
				}
				if (c.alias?.flags) {
					for (const [short, long] of Object.entries(c.alias.flags)) {
						alias[long] = Array.isArray(alias[long])
							? [...(alias[long] as string[]), short]
							: [short]
						alias[short] = Array.isArray(alias[short])
							? [...(alias[short] as string[]), long]
							: [long]
						booleans.push(short)
					}
				}
			}

			if (c.options) {
				for (const k of Object.keys(c.options)) {
					strings.push(k)
				}
				if (c.alias?.options) {
					for (
						const [short, long] of Object.entries(c.alias.options)
					) {
						alias[long] = Array.isArray(alias[long])
							? [...(alias[long] as string[]), short]
							: [short]
						alias[short] = Array.isArray(alias[short])
							? [...(alias[short] as string[]), long]
							: [long]
						strings.push(short)
					}
				}
			}

			const slice = [
				arg,
				...(argv[i + 1] !== undefined ? [argv[i + 1]] : []),
			]
			const parsed = minimist(slice, {
				alias,
				boolean: booleans,
				string: strings,
			})
			const keys = Object.keys(parsed).filter((k) =>
				k !== "_" && k !== "--"
			)

			if (keys.length === 0) {
				throw new UnknownParameter(arg)
			}

			let consumedNext = false
			const seen = new Set<string>()

			for (const k of keys) {
				// resolve to canonical key within current command context
				let key = k
				if (!is("flags", key) && !is("options", key)) {
					const real = expand("flags", key) ?? expand("options", key)
					if (!real) {
						throw new UnknownParameter(arg)
					}
					key = real
				}
				if (seen.has(key)) {
					continue
				}
				seen.add(key)

				if (is("flags", key)) {
					result.flags[key] = true
					continue
				}

				if (is("options", key)) {
					const option = c.options![key]
					const transformer = option.transformer ?? ((v: string) => v)

					let rawValue: string
					if (parsed[k] === true && !arg.includes("=")) {
						rawValue = String(argv[i + 1])
						consumedNext = argv[i + 1] !== undefined || consumedNext
					} else {
						rawValue = String(parsed[k])
					}

					if (option.multiple) {
						result.options[key] = result.options[key] ?? []
						const values = result.options[key] as unknown[]
						values.push(await transformer(rawValue))
						continue
					}

					result.options[key] = await transformer(rawValue)
					continue
				}

				throw new UnknownParameter(arg)
			}

			if (consumedNext) {
				i++
			}
			continue
		}

		const maybe = expand("commands", arg) ?? arg
		if (is("commands", maybe)) {
			commands.push(maybe)
			c = merge(helper, c.commands![maybe])

			continue
		}

		if (!c.arguments || result.arguments.length >= c.arguments.length) {
			throw new UnknownParameter(arg)
		}

		result.arguments.push(
			await c.arguments[result.arguments.length].transformer(arg),
		)
	}

	return [
		commands.join(" "),
		result,
		c,
	] as never
}
