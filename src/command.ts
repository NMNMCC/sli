import type {Argument, InferArgument} from "./argument.ts"
import type {Flag, InferFlag} from "./flag.ts"
import type {InferOption, Option} from "./option.ts"

export type Handler<
	TFlagResults extends Record<string, boolean>,
	TOptionResults extends Record<string, unknown>,
	TArgumentResults extends unknown[],
> = (
	flags: TFlagResults,
	options: TOptionResults,
	...arguments_: TArgumentResults
) => Promise<void> | void

export type InferFlags<out TFlags extends Record<string, Flag>> = {
	[K in keyof TFlags]: InferFlag<TFlags[K]>
}
export type InferOptions<out TOptions extends Record<string, Option<unknown>>> =
	{
		[K in keyof TOptions]: InferOption<TOptions[K]>
	}
export type InferArguments<TArguments extends Argument<unknown>[]> = [
	...{ [K in keyof TArguments]: InferArgument<TArguments[K]> },
]

export type Subcommand<
	SFlags extends Record<string, Flag> = Record<string, Flag>,
	SOptions extends Record<string, Option<unknown>> = Record<
		string,
		Option<unknown>
	>,
	SArguments extends Argument<unknown>[] = Argument<unknown>[],
> = <
	TFlags extends Record<string, Flag> = Record<string, Flag>,
	TOptions extends Record<string, Option<unknown>> = Record<
		string,
		Option<unknown>
	>,
	TArguments extends Argument<unknown>[] = Argument<unknown>[],
>(
	flags: TFlags,
	options: TOptions,
	...arguments_: TArguments
) => Command<
	Record<string, Subcommand>,
	TFlags & SFlags,
	TOptions & SOptions,
	[...TArguments, ...SArguments]
>

export type Command<
	TSubCommands extends Record<string, Subcommand> = Record<
		string,
		Subcommand
	>,
	TFlags extends Record<string, Flag> = Record<string, Flag>,
	TOptions extends Record<string, Option<unknown>> = Record<
		string,
		Option<unknown>
	>,
	TArguments extends Argument<unknown>[] = Argument<unknown>[],
> = {
	description?: string
	subcommands?: TSubCommands
	flags?: TFlags
	options?: TOptions
	alias?: {
		subcommands?: { [K in string]: keyof TSubCommands }
		flags?: { [K in string]: keyof TFlags }
		options?: { [K in string]: keyof TOptions }
	}
	arguments?: TArguments
	handler?: Handler<
		InferFlags<TFlags>,
		InferOptions<TOptions>,
		InferArguments<TArguments>
	>
}

export const command = <
	const TSubCommands extends Record<string, Subcommand>,
	const TFlags extends Record<string, Flag>,
	const TOptions extends Record<string, Option<unknown>>,
	const TArguments extends Argument<unknown>[],
>(
	c: Command<TSubCommands, TFlags, TOptions, TArguments>,
): Command<TSubCommands, TFlags, TOptions, TArguments> => {
	return c
}

export const subcommand = <
	SSubCommands extends Record<string, Subcommand> = Record<
		string,
		Subcommand
	>,
	SFlags extends Record<string, Flag> = Record<string, Flag>,
	SOptions extends Record<string, Option<unknown>> = Record<
		string,
		Option<unknown>
	>,
	SArguments extends Argument<unknown>[] = Argument<unknown>[],
>(
	s: Command<SSubCommands, SFlags, SOptions, SArguments>,
): Subcommand<SFlags, SOptions, SArguments> =>
(
	flags,
	options,
	...arguments_
) => {
	s.flags = Object.assign({}, flags, s.flags ?? {}) as never
	s.options = Object.assign({}, options, s.options) as never
	s.arguments = [...arguments_, ...(s.arguments ?? [])] as never

	return s as never
}
