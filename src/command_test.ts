import {command, subcommand} from "./command.ts"

export default command({
	description: "An example command",
	options: {
		option1: {
			description: "The first option",
			multiple: false,
			transformer: (input) => input,
		},
		option2: {
			description: "The second option",
			multiple: true,
			transformer: (input) => String(input).split(","),
		},
	},
	arguments: [{
		name: "arg1",
		description: "The first argument",
		transformer: (input: string) => parseInt(input, 10),
	}],
	alias: {
		options: {
			o1: "option1",
		},
	},
	subcommands: {
		sub: subcommand({
			description: "A nested subcommand",
			options: {
				subOption: {
					description: "An option for the subcommand",
					multiple: false,
					transformer: (input) => String(input).toUpperCase(),
				},
			},
			handler: () => {
				console.log("subcommand invoked")
			},
		}),
	},
	handler: ({option1, option2}, arg1) => {
		console.log(option1, option2, arg1)
	},
})
