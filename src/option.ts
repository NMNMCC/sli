export type Single<T> =
	& {multiple?: false; description?: string}
	& (
		| {required: true; parser?: (input: string) => Promise<T> | T}
		| {required?: false; parser?: (input?: string) => Promise<T> | T}
	)

export type Multiple<T> =
	& {multiple: true; description?: string}
	& (
		| {required: true; parser?: (input: string) => Promise<T> | T}
		| {required?: false; parser?: (input?: string) => Promise<T> | T}
	)

export type Option<T = string> = Single<T> | Multiple<T>

export type InferOption<T extends Option<unknown>> =
	// deno-lint-ignore no-explicit-any
	NonNullable<T["parser"]> extends (...args: any) => infer R
		? (T extends {multiple: true} ? Awaited<R>[] : Awaited<R>)
		: (T extends {multiple: true} ? string[] : string)

export const option = <const O, const T extends Option<O> = Option<O>>(
	opt: T,
): T => opt
