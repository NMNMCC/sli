import {type Command, command} from "./command.ts"
import type {CommandResultEntry, InferCommands} from "./result.ts"
import type {Merge} from "./util.ts"

class UnknownParameter extends Error {
	constructor(context: unknown, parameter: string) {
		super(`unknown parameter ${parameter}\n${JSON.stringify(context)}\n`)
	}
}
class InvalidShortOption extends Error {
	constructor(context: unknown, option: string) {
		super(`invalid short option ${option}\n${JSON.stringify(context)}\n`)
	}
}
class MissingRequiredParameter extends Error {
	constructor(context: unknown, option: string) {
		super(
			`missing required parameter ${option}\n${
				JSON.stringify(context)
			}\n`,
		)
	}
}

const helper = command({
	flags: {
		help: {
			description: "Display help information about the command",
			fallback: false,
		},
	},
}) as {
	flags: {
		help: {
			description: "Display help information about the command"
			fallback: false
		}
	}
}

type Context = [string, {
	flags: Record<string, boolean>
	options: Record<string, unknown[]>
	arguments: unknown[]
	raw: string
}]

export const parse = async <const TCommand extends Command>(
	argv: string[],
	command: TCommand,
	[path, data]: Context = ["", {
		flags: {},
		options: {},
		arguments: [],
		raw: "",
	}],
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
	const [head, ...tail] = argv

	if (!head) {
		for (const [key, value] of Object.entries(command.options ?? {})) {
			// check required option
			if (!data.options[key]) {
				throw new MissingRequiredParameter({path, data, command}, key)
			}
			// apply option fallback
			if (!value.multiple) {
				data.options[key] = data.options[key].at(-1) as never
			}
		}

		for (const [key, value] of Object.entries(command.flags ?? {})) {
			data.flags[key] = data.flags[key] ?? value.fallback
		}

		return [path, data, command] as never
	} else if (head === "--") {
		data.raw = tail.slice(1).join(" ")
		return await parse([], command, [path, data])
	} else if (!head.startsWith("-")) {
		const candidate = command.commands?.[head]
		if (!candidate) {
			// maybe it is a short command?
			const _command = command.commands
				?.[command.alias?.commands?.[head] ?? ""]
			if (_command) {
				return await parse(
					tail,
					_command,
					[path, data],
				) as never
			}

			// maybe it is an argument?
			if (
				data.arguments.length >= (command.arguments?.length ?? 0)
			) {
				throw new UnknownParameter({path, data, command}, head)
			}

			data.arguments.push(head)
			return await parse(tail, command, [path, data])
		}

		return await parse(tail, candidate, [
			[path, head].join(" ").trim(),
			data,
		]) as never
	} else if (!head.startsWith("--")) {
		const keys = head.slice(1).split("")

		for (const [idx, key] of keys.entries()) {
			const candidate = command.alias?.flags?.[key]
			if (!candidate) {
				// maybe it is an option?
				const option = command.alias?.options?.[key]
				if (!option) {
					throw new UnknownParameter({path, data, command}, head)
				}

				if (idx !== keys.length - 1) {
					// short option can only be placed at the end
					throw new InvalidShortOption({path, data, command}, option)
				}

				return await parse(
					[`--${option}`, ...tail],
					command,
					[path, data],
				)
			}

			data.flags[candidate] = true
		}

		return await parse(
			tail,
			command,
			[path, data],
		)
	} else {
		const key = head.slice(2)
		const candidateCommand = command.flags?.[key]
		if (!candidateCommand) {
			// maybe it is a flag alias?
			const _flag = command.alias?.flags?.[key]
			if (_flag) {
				return await parse([`--${_flag}`, ...tail], command, [
					path,
					data,
				])
			}

			// maybe it ts an option?
			const optionCommand = command.options?.[key]
			if (!optionCommand) {
				// maybe it is a option alias?
				const _option = command.alias?.options?.[key]
				if (_option) {
					return await parse([`--${key}`, ...tail], command, [
						path,
						data,
					])
				}
				throw new UnknownParameter({path, data, command}, head)
			}

			const transformer = optionCommand.transformer ?? ((s: string) => s)
			const [value, ..._] = tail
			data.options[key] = [
				...(data.options[key] ?? []),
				transformer(value),
			]
			return await parse(_, command, [path, data])
		}

		data.flags[key] = true
		return await parse(tail, command, [path, data])
	}
}
