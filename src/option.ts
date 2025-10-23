type Transformer<T> = (input: string) => Promise<T> | T

export type Option<T = string> =
	& {
		description?: string
		transformer?: Transformer<T>
	}
	& (
		| {
			multiple?: false
		}
			& ({
				required: true
			} | {
				required?: false
				fallback: T
			})
		| (
			& {
				multiple: true
			}
			& ({
				required: true
			} | {
				required?: false
				fallback: T[]
			})
		)
	)

export type InferOption<T extends Option<unknown>> =
	T extends { transformer: infer F }
		? F extends Transformer<infer O>
			? T extends { multiple: true } ? O[] : O
			: never
		: T extends { fallback: infer FB }
			? FB
			: T extends { multiple: true } ? string[] : string

export const option = <const O, const T extends Option<O> = Option<O>>(
	opt: T,
): T => opt
