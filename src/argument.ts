export type Argument<out T> = {
	name: string
	description: string
	transformer: (input: string) => Promise<T> | T
}

export type InferArgument<T extends Argument<unknown>> = T extends
	Argument<infer U> ? U
	: never

export const argument = <T>(a: Argument<T>): Argument<T> => {
	return a
}
