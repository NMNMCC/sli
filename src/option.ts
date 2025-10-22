type Transformer<T> = (input: string) => Promise<T> | T

type SingleOption<T> = {
	description: string
	required?: boolean
	multiple?: false
	fallback?: T
	transformer: Transformer<T>
}

type MultipleOption<T> = {
	description: string
	required?: boolean
	multiple: true
	fallback?: T[]
	transformer: Transformer<T>
}

export type Option<T> = SingleOption<T> | MultipleOption<T>

export type InferOption<T extends Option<unknown>> = T extends
	MultipleOption<infer U> ? U[]
	: T extends {transformer: Transformer<infer U>} ? U
	: never

export const option = <T>(o: Option<T>): Option<T> => {
	return o
}
