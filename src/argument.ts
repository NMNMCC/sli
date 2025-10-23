import type {Transformer} from "./util.ts"

export type Argument<out T = string> = {
	name: string
	description?: string
	parser?: Transformer<T>
}

export type InferArgument<T> = T extends {parser?: Transformer<infer T>} ? T
	: never

export const argument = <const O, const T extends Argument<O> = Argument<O>>(
	arg: T,
): T => arg
