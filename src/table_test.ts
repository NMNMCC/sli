import {table} from "./table.ts"
import {assertEquals} from "@std/assert"

const result = table(
	"col",
	[["Name", "Age"], ["Alice", "30"], ["Bob", "25"]],
	"",
	" | ",
	"",
)

assertEquals(
	result,
	`Name | Alice | Bob
Age  | 30    | 25
`,
)
