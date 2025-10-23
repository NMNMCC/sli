import {table} from "./table.ts"
import type {Command} from "./command.ts"

const fmt = (a: string): string =>
	a.startsWith('-') ? a : a.length === 1 ? `-${a}` : `--${a}`

const matches = (k: string, m?: Record<string, string>): string[] => {
	const r = [`--${k}`]
	if (!m) return r
	Object.entries(m).forEach(([a, t]) => t === k && r.push(fmt(a)))
	return r
}

export const help = <
	const TCommand extends Command = Command,
>(
	title: string,
	cmd: TCommand,
): string => {
	const sections = []

	sections.push(
		cmd.description ? `${title}\n${cmd.description}\n` : `${title}\n`
	)

	if (cmd.commands && Object.keys(cmd.commands).length > 0) {
		sections.push(
			"Commands:\n" +
				table(
					"row",
					Object.entries(cmd.commands).map(([k, v]) => {
						const aliases = cmd.alias?.commands
							? Object.entries(cmd.alias.commands)
								.filter(([_, t]) => t === k)
								.map(([a, _]) => a)
							: []
						const name = aliases.length > 0 ? `${k}, ${aliases.join(", ")}` : k
						return [name, v.description || ""]
					}),
					"\t",
					"\t",
					"\t",
				),
		)
	}

	if (cmd.flags && Object.keys(cmd.flags).length > 0) {
		sections.push(
			"Flags:\n" +
				table(
					"row",
					Object.entries(cmd.flags).map(([k, v]) => [
						matches(k, cmd.alias?.flags).join(", "),
						String(v.fallback),
						v.description,
					]),
					"\t",
					"\t",
					"\t",
				),
		)
	}

	if (cmd.options && Object.keys(cmd.options).length > 0) {
		sections.push(
			"Options:\n" +
				table(
					"row",
					Object.entries(cmd.options).map(([k, v]) => {
						const m = matches(k, cmd.alias?.options)
						let desc = v.description

						if ('required' in v && v.required) desc += " <required>"

						if ('fallback' in v && v.fallback !== undefined) {
							const def = Array.isArray(v.fallback)
								? v.fallback.join(", ")
								: String(v.fallback)
							desc += ` [default: ${def}]`
						}

						return [m.join(", "), desc, ""]
					}),
					"\t",
					"\t",
					"\t",
				),
		)
	}

	if (cmd.arguments && cmd.arguments.length > 0) {
		sections.push(
			"Arguments:\n" +
				table(
					"row",
					cmd.arguments.map((v, i) => [
						String(i + 1),
						`<${v.name}>`,
						v.description,
					]),
					"\t",
					"\t",
					"\t",
				),
		)
	}

	return sections.join("\n") + "\n"
}
