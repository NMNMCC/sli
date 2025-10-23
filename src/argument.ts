import type {Transformer} from "./util.ts"

export type Argument<out T = string> = {
	name: string
	description?: string
	transformer?: Transformer<T>
}

export type InferArgument<T> = T extends Argument<infer U> ? U
	: never

export const argument = <const O, const T extends Argument<O> = Argument<O>>(
	arg: T,
): T => arg
