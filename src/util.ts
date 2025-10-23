export type String<T> = T extends infer U ? U extends string ? U : never : never
export type Number<T> = T extends infer U ? U extends number ? U : never : never

export type Merge<A, B> =
	& Omit<A, keyof B>
	& {
		[K in keyof B]: K extends keyof A
			// deno-lint-ignore no-explicit-any
			? A[K] extends Record<string, any>
				// deno-lint-ignore no-explicit-any
				? B[K] extends Record<string, any> ? Merge<A[K], B[K]>
					// deno-lint-ignore no-explicit-any
				: A[K] extends any[]
					// deno-lint-ignore no-explicit-any
					? B[K] extends any[] ? [...A[K], ...B[K]] : B[K]
				: B[K]
			: B[K]
			: B[K]
	}

// deno-lint-ignore no-explicit-any
const isObject = (item: any): item is Record<string, any> => {
	return item && typeof item === "object" && !Array.isArray(item)
}

export function merge<A extends object, B extends object>(
	a: A,
	b: B,
): Merge<A, B> {
	// deno-lint-ignore no-explicit-any
	const result = {...a} as any

	for (const key in b) {
		if (Object.prototype.hasOwnProperty.call(b, key)) {
			// deno-lint-ignore no-explicit-any
			const aValue = (a as any)[key]
			const bValue = b[key]

			if (isObject(aValue) && isObject(bValue)) {
				result[key] = merge(aValue, bValue)
			} else if (Array.isArray(aValue) && Array.isArray(bValue)) {
				result[key] = [...aValue, ...bValue]
			} else {
				result[key] = bValue
			}
		}
	}

	return result
}
