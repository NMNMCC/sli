import {option} from "./option.ts"

option({
	description: "A test option",
	transformer(input) {
		if (typeof input === "boolean") {
			return input ? "enabled" : "disabled"
		} else {
			return "enabled"
		}
	},
})
