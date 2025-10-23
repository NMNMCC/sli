import type {Command, InferCommand} from "./command.ts"
import type {Flag, InferFlag} from "./flag.ts"
import type {InferOption, Option} from "./option.ts"
import type {Argument, InferArgument} from "./argument.ts"
import type {Merge, String} from "./util.ts"

export type Flags = Record<string, Flag>
export type Options = Record<string, Option<unknown>>
export type Arguments = Argument<unknown>[]
export type Commands = Record<string, Command>

export type FlagResults = Record<string, boolean>
export type OptionResults = Record<string, unknown>
export type ArgumentResults = unknown[]

export type InferFlags<TFlags> = TFlags extends Flags ? {
		[K in String<keyof TFlags>]: InferFlag<TFlags[K]>
	}
	: Record<PropertyKey, never>
export type InferOptions<TOptions> = TOptions extends Options ? {
		[K in String<keyof TOptions>]: InferOption<TOptions[K]>
	}
	: Record<PropertyKey, never>
export type InferArguments<TArguments> = TArguments extends Arguments ? [
		...{ [K in keyof TArguments]: InferArgument<TArguments[K]> },
	]
	: []

type SubcommandPath<T> = T extends {commands?: infer C}
	? C extends Record<string, Command> ? {
			[K in keyof C]:
				| (K & string)
				| `${K & string} ${SubcommandPath<C[K]> & string}`
		}[keyof C]
	: never
	: never

type CommandPath<T> = "" | SubcommandPath<T>

export type FromCommandPath<
	T,
	P extends string,
> = P extends "" ? T
	: T extends {commands?: infer C} ? Merge<
			T,
			C extends Record<string, Command>
				? P extends `${infer K} ${infer Rest}`
					? K extends keyof C ? FromCommandPath<C[K], Rest>
					: never
				: P extends keyof C ? C[P]
				: never
				: never
		>
	: never

export type InferCommands<T extends Command> = {
	[k in CommandPath<T>]: [
		InferCommand<FromCommandPath<T, k>>,
		FromCommandPath<T, k>,
	]
}

// deno-lint-ignore no-explicit-any
export type CommandResultEntry<T extends InferCommands<any>> = {
	// deno-lint-ignore no-explicit-any
	[K in keyof T]: [K, ...(T[K] extends any[] ? T[K] : [])]
}[keyof T]
