export type Argument<out T = string> = {
	name: string
	description: string
	transformer: (input: string) => Promise<T> | T
}

export type InferArgument<T> = T extends Argument<infer U> ? U
	: never

export const argument = <const T extends Argument>(arg: T): T => arg
