type Table = {
	(
		direction: "row",
		rows: string[][],
		indent: string,
		gutter: string,
		outdent: string,
	): string
	(
		direction: "col",
		cols: string[][],
		indent: string,
		gutter: string,
		outdent: string,
	): string
}

export const table: Table = (
	direction: "col" | "row",
	cols: string[][],
	indent: string,
	gutter: string,
	outdent: string,
): string => {
	if (direction === "row") {
		return table("col", transpose(cols), indent, gutter, outdent)
	}

	const rowTotal = Math.max(...cols.map((col) => col.length))
	const colTotal = cols.length
	const colWidths = cols.map((col) =>
		Math.max(...col.map((cell) => cell.length))
	)

	let result = ""
	for (let i = 0; i < rowTotal; i++) {
		let row = indent
		for (let j = 0; j < colTotal; j++) {
			const cell = cols[j][i]

			if (j < colTotal - 1) {
				row += cell.padEnd(colWidths[j])
				row += gutter
			} else {
				row += cell
			}
		}
		result += row + outdent + "\n"
	}
	return result
}

const transpose = (matrix: string[][]): string[][] => {
	return matrix[0].map((_, idx) => matrix.map((row) => row[idx]))
}
