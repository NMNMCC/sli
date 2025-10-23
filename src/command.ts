import type {
	Arguments,
	Commands,
	Flags,
	InferArguments,
	InferFlags,
	InferOptions,
	Options,
} from "./result.ts"
import type {String} from "./util.ts"

export interface Command {
	description?: string
	flags?: Flags
	options?: Options
	alias?: Alias<
		this["commands"] extends Commands ? this["commands"] : never,
		this["flags"] extends Flags ? this["flags"] : never,
		this["options"] extends Options ? this["options"] : never
	>
	arguments?: Arguments
	commands?: Commands
}

export interface Alias<
	TCommands extends Commands,
	TFlags extends Flags,
	TOptions extends Options,
> {
	commands?: {[K: string]: String<keyof TCommands>}
	flags?: {[K: string]: String<keyof TFlags>}
	options?: {[K: string]: String<keyof TOptions>}
}

export const command = <const T extends Command>(c: T): T => c

// InferCommand now extracts types from the generic parameters of Command.
export type InferCommand<TCommand extends Command> = {
	flags: InferFlags<TCommand["flags"]>
	options: InferOptions<TCommand["options"]>
	arguments: InferArguments<TCommand["arguments"]>
	raw: string
}
