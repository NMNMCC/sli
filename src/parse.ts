import {type Command, command} from "./command.ts"
import type {CommandResultEntry, InferCommands} from "./result.ts"
import {type Merge, merge} from "./util.ts"

export class UnknownParameter extends Error {
	constructor(parameter: string) {
		super(`unknown parameter ${parameter}`)
	}
}
export class InvalidShortOption extends Error {
	constructor(option: string) {
		super(`invalid short option ${option}`)
	}
}
export class MissingRequiredParameter extends Error {
	constructor(option: string) {
		super(
			`missing required parameter ${option}`,
		)
	}
}
export class MissingOptionValue extends Error {
	constructor(option: string) {
		super(`missing option value ${option}`)
	}
}
export class MissingParser extends Error {
	constructor(option: string) {
		super(`missing parser ${option}`)
	}
}

const helper = command({
	flags: {
		help: {
			description: "Display help information about the command",
			default: false,
		},
	},
}) as {
	readonly flags: {
		readonly help: {
			readonly description: "Display help information about the command"
			readonly default: false
		}
	}
}

export type Context = [string, {
	flags: Record<string, boolean>
	options: Record<string, unknown[]>
	arguments: unknown[]
	raw: string
}, error?: Error]

export const parse = async <const TCommand extends Command>(
	argv: string[],
	cmd: TCommand,
	[path, data, error]: Context = ["", {
		flags: {},
		options: {},
		arguments: [],
		raw: "",
	}],
): Promise<
	[
		...CommandResultEntry<
			InferCommands<
				Merge<
					typeof helper,
					TCommand
				>
			>
		>,
		error?: Error,
	]
> => {
	const command = merge(helper, cmd) as TCommand

	const [head, ...tail] = argv

	if (!head) {
		for (const [key, value] of Object.entries(command.options ?? {})) {
			// check required option and apply defaults
			if (!data.options[key] || data.options[key].length === 0) {
				if (value.required) {
					return [
						path,
						data,
						command,
						new MissingRequiredParameter(`--${key}`),
					] as never
				}
				if (!value.parser) {
					return [
						path,
						data,
						command,
						new MissingParser(`--${key}`),
					] as never
				}
				data.options[key] = await value.parser() as never
			}
			if (!value.multiple) {
				data.options[key] = data.options[key].at(-1) as never
			}
		}

		for (const [key, value] of Object.entries(command.flags ?? {})) {
			data.flags[key] = data.flags[key] ?? value.default
		}

		return [path, data, command, error] as never
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
				return await parse([], command, [
					path,
					data,
					new UnknownParameter(head),
				])
			}

			data.arguments.push(head)
			return await parse(tail, command, [path, data])
		}

		return await parse(
			tail,
			merge(cmd, candidate),
			[[path, head].join(" ").trim(), data],
		) as never
	} else if (!head.startsWith("--")) {
		const keys = head.slice(1).split("")

		for (const [idx, key] of keys.entries()) {
			const candidate = command.alias?.flags?.[key]
			if (!candidate) {
				// maybe it is an option?
				const option = command.alias?.options?.[key]
				if (!option) {
					return await parse(
						[],
						command,
						[path, data, new UnknownParameter(head)],
					)
				}

				if (idx !== keys.length - 1) {
					// short option can only be placed at the end
					return await parse([], command, [
						path,
						data,
						new InvalidShortOption(option),
					])
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
				return await parse([], command, [
					path,
					data,
					new UnknownParameter(head),
				])
			}

			const parser = optionCommand.parser ?? ((s?: string) => s)
			const value = tail[0]
			if (!value) {
				return await parse([], command, [
					path,
					data,
					new MissingOptionValue(head),
				])
			}
			data.options[key] = [
				...(data.options[key] ?? []),
				await parser(value),
			]
			return await parse(tail.slice(1), command, [path, data])
		}

		data.flags[key] = true
		return await parse(tail, command, [path, data])
	}
}
