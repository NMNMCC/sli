export type Flag = {
	description?: string
	default: boolean
}

export type InferFlag<_T extends Flag> = boolean

export const flag = (f: Flag) => f
