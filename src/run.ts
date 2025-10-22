import type {Argument} from "./argument.ts"
import type {Command, Subcommand} from "./command.ts"
import type {Flag} from "./flag.ts"
import type {Option} from "./option.ts"

export const run = async <
	const TSubCommands extends Record<string, Subcommand>,
	const TFlags extends Record<string, Flag>,
	const TOptions extends Record<string, Option<unknown>>,
	const TArguments extends Argument<unknown>[],
>(
	args: string[],
	c: Command<TSubCommands, TFlags, TOptions, TArguments>,
	executable = args[0],
): Promise<void> => {
	const marks = Array.from({length: args.length}, () => false)
	const flags = Object.fromEntries(
		Object.entries(c.flags ?? {}).map((
			[flag],
		) => [
			flag,
			args.some((arg, idx) => {
				const result = [
					`--${flag}`,
					...Object.entries(c.alias?.flags || {}).filter((
						[, value],
					) => value === flag).map(([key]) => `-${key}`),
				].includes(arg)
				if (result) {
					marks[idx] = true
				}
				return result
			}),
		]),
	)
	const options = Object.fromEntries(
		Object.entries(c.options ?? {}).map((
			[option],
		) => [
			option,
			args.flatMap((arg, idx, arr) => {
				const result = [
					`--${option}`,
					...Object.entries(c.alias?.options || {}).filter((
						[, value],
					) => value === option).map(([key]) => `-${key}`),
				].includes(arg)

				if (result) {
					marks[idx] = true
					marks[idx + 1] = true
					return [arr[idx + 1]]
				} else {
					return []
				}
			}),
		]),
	)
	const remaining = args.filter((_, i) => !marks[i])
	const argumentTotal = c.arguments?.length ?? 0
	const arguments_ = argumentTotal > 0 ? remaining.slice(-argumentTotal) : []
	const commands = remaining.slice(0, remaining.length - arguments_.length)

	if (commands.length === 0) {
		return await c.handler?.(
			flags as never,
			Object.fromEntries(
				Object.entries(c.options ?? {}).map((
					[key, value],
				) => {
					if (value.multiple) {
						return [key, options[key].map(value.transformer)]
					} else {
						return [key, value.transformer(options[key].at(-1)!)]
					}
				}),
			) as never,
			...(c.arguments ?? []).map((arg, index) => {
				return arg.transformer(arguments_[index])
			}) as never,
		)
	}

	const _s = c.subcommands?.[commands[0]]
	if (!_s) {
		throw new Error(`Unknown command: ${commands[0]}`)
	}
	return run(
		args.slice(1),
		_s(
			c.flags ?? {},
			c.options ?? {},
			...c.arguments ?? [],
		),
		executable,
	)
}
