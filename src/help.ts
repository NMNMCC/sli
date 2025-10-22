import {table} from "./table.ts"
import type {Argument} from "./argument.ts"
import type {Command, Subcommand} from "./command.ts"
import type {Flag} from "./flag.ts"
import type {Option} from "./option.ts"

export function help<
	TSubCommands extends Record<string, Subcommand>,
	TFlags extends Record<string, Flag>,
	TOptions extends Record<string, Option<unknown>>,
	TArguments extends Argument<unknown>[],
>(
	title: string,
	command: Command<TSubCommands, TFlags, TOptions, TArguments>,
): string {
	const parentFlags = (command.flags ?? {}) as TFlags
	const parentOptions = (command.options ?? {}) as TOptions
	const parentArguments = (command.arguments ?? []) as TArguments

	const subcommandsSection = command.subcommands
		? "Commands:\n" +
			table(
				"row",
				Object.entries(command.subcommands).map<[string, string]>(
					([key, build]) => [
						key,
						build(
							parentFlags,
							parentOptions,
							...parentArguments,
						)
							.description ??
							"",
					],
				),
				"\t",
				"\t",
				"\t",
			)
		: undefined

	const optionsSection = command.options
		? "Options:\n" +
			table(
				"row",
				Object.entries(command.options).map<[string, string]>(
					([key, value]) => [key, value.description],
				),
				"\t",
				"\t",
				"\t",
			)
		: undefined

	const argumentsSection = command.arguments
		? "Arguments:\n" +
			table(
				"row",
				command.arguments.map<[string, string]>((value, index) => [
					`<${index}:${value.name}>`,
					value.description,
				]),
				"\t",
				"\t",
				"\t",
			)
		: undefined

	return [
		title,
		command.description,
		"\n",
		subcommandsSection,
		optionsSection,
		argumentsSection,
	]
		.filter(Boolean)
		.join("\n") + "\n"
}
