import {table} from "./table.ts"
import type {Command} from "./command.ts"

const format = (a: string): string => a.length === 1 ? `-${a}` : `--${a}`

const matches = (
	k: string,
	m: Record<string, string>,
	f: (s: string) => string,
): string[] => [
	f(k),
	...Object.entries(m)
		.filter(([, t]) => t === k)
		.map(([a]) => a).map(f),
]

export const help = <
	const TCommand extends Command = Command,
>(
	cmd: TCommand,
): string =>
	[
		(cmd.description ?? "") + "\n",
		cmd.commands && Object.keys(cmd.commands).length > 0 &&
		"Commands:\n" +
			table(
				"row",
				Object.entries(cmd.commands).map(([k, v]) => {
					return [
						matches(k, cmd.alias?.commands ?? {}, (o) => o)
							.toSorted((a, b) => a.length - b.length)
							.join(", "),
						v.description || "",
					]
				}),
				"\t",
				"  ",
				"\t",
			),

		cmd.flags && Object.keys(cmd.flags).length > 0 &&
		"Flags:\n" +
			table(
				"row",
				Object.entries(cmd.flags).map(([k, v]) => [
					matches(k, cmd.alias?.flags ?? {}, format).join(", "),
					String(v.default ?? false),
					v.description ?? "",
				]),
				"\t",
				"  ",
				"\t",
			),

		cmd.options && Object.keys(cmd.options).length > 0 &&
		"Options:\n" +
			table(
				"row",
				Object.entries(cmd.options).map<
					[string, string, string, string]
				>(
					([k, v]) => {
						return [
							matches(k, cmd.alias?.options ?? {}, format)
								.join(", "),
							v.required ? "required" : "optional",
							(typeof ((!v.required && v.parser)
								? v.parser()
								: "")) + (v.multiple ? "[]" : ""),
							v.description ?? "",
						]
					},
				),
				"\t",
				"  ",
				"\t",
			),

		cmd.arguments && cmd.arguments.length > 0 &&
		"Arguments:\n" +
			table(
				"row",
				cmd.arguments.map((v, i) => [
					String(i + 1),
					`<${v.name}>`,
					v.description ?? "",
				]),
				"\t",
				"  ",
				"\t",
			),
	].filter(Boolean).join("\n") + "\n"
