import {table} from "./table.ts"
import type {Option} from "./option.ts"
import type {Command, Subcommand} from "./command.ts"
import type {Argument} from "./argument.ts"
import type {Flag} from "./flag.ts"

export function help<
	const TSubCommands extends Record<string, Subcommand>,
	const TFlags extends Record<string, Flag>,
	const TOptions extends Record<string, Option<unknown>>,
	const TArguments extends Argument<unknown>[],
>(
	title: string,
	c: Command<TSubCommands, TFlags, TOptions, TArguments>,
): string {
	return [
		title,
		c.description,
		"\n",
		"subcommands" in c && c.subcommands &&
		"Commands:\n" +
			table(
				"row",
				Object.entries(c.subcommands).map<[string, string]>((
					[key, value],
				) => [
					key,
					value(
						c.flags || {},
						c.options || {},
						...(c.arguments || []),
					)
						.description ||
					"",
				]),
				"\t",
				"\t",
				"\t",
			),
		"flags" in c && c.flags &&
		"Flags:\n" +
			table(
				"row",
				Object.entries(c.flags).map<[string, string, string]>((
					[key, value],
				) => [
					[
						...Object.entries(c.alias?.flags ?? {}).filter((
							[, value],
						) => value === key).map(([key]) => `-${key}`),
						`--${key}`,
					].join(", "),
					String(value.fallback),
					value.description,
				]),
				"\t",
				"\t",
				"\t",
			),
		"options" in c && c.options &&
		"Options:\n" +
			table(
				"row",
				Object.entries(c.options).map<[string, string]>((
					[key, value],
				) => [
					[
						...Object.entries(c.alias?.options ?? {}).filter((
							[, value],
						) => value === key).map(([key]) => `-${key}`),
						`--${key}`,
					].join(", "),
					(value as Option<unknown>).description,
				]),
				"\t",
				"\t",
				"\t",
			),
		"arguments" in c && c.arguments &&
		"Arguments:\n" +
			table(
				"row",
				(c.arguments as Argument<unknown>[]).map<
					[string, string, string]
				>((
					value,
					index,
				) => [String(index), `<${value.name}>`, value.description]),
				"\t",
				"\t",
				"\t",
			),
	].filter(Boolean).join("\n") + "\n"
}
