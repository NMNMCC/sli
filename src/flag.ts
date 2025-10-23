export type Flag = {
	description?: string
	fallback: boolean
}

export type InferFlag<_T extends Flag> = boolean

export const flag = (f: Flag) => f
