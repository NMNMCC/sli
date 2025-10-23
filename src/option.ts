type Transformer<T> = (input: string) => Promise<T> | T

type SingleOption<T> =
	& {
		description: string
		multiple?: false
		transformer?: Transformer<T>
	}
	& ({
		required: true
	} | {
		required?: false
		fallback: T
	})

type MultipleOption<T> =
	& {
		description: string
		multiple: true
		transformer?: Transformer<T>
	}
	& ({
		required: true
	} | {
		required?: false
		fallback: T[]
	})

export type Option<T = string> = SingleOption<T> | MultipleOption<T>

export type InferOption<T extends Option<unknown>> = T extends
	MultipleOption<infer U> ? U[]
	: T extends SingleOption<infer U> ? U
	: string

export const option = <const T extends Option>(opt: T): T => opt
