type Table = {
	(
		direction: "row",
		rows: unknown[][],
		indent: string,
		gutter: string,
		outdent: string,
	): string
	(
		direction: "col",
		cols: unknown[][],
		indent: string,
		gutter: string,
		outdent: string,
	): string
}

export const table: Table = (
	dir: "col" | "row",
	data: unknown[][],
	indent: string,
	gutter: string,
	outdent: string,
): string => {
	if (dir === "row") {
		return table("col", transpose(data), indent, gutter, outdent)
	}

	const rows = Math.max(...data.map((c) => c.length))
	const cols = data.length
	const widths = data.map((c) =>
		Math.max(...c.map((cell) => String(cell).length))
	)

	let out = ""
	for (let i = 0; i < rows; i++) {
		let row = indent
		for (let j = 0; j < cols; j++) {
			const cell = String(data[j][i])

			if (j < cols - 1) {
				row += cell.padEnd(widths[j]) + gutter
			} else {
				row += cell
			}
		}
		out += row + outdent + "\n"
	}
	return out
}

const transpose = <T>(matrix: T[][]): T[][] => {
	return matrix[0].map((_, idx) => matrix.map((row) => row[idx]))
}
