import deno from "../deno.json" with {type: "json"}
import {build, emptyDir} from "@deno/dnt"

const out = "./.dist/npm"

await emptyDir(out)

await build({
	entryPoints: ["./mod.ts"],
	typeCheck: false,
	outDir: out,
	shims: {
		deno: true,
	},
	package: {
		name: "@nmnmcc/sli",
		version: deno.version,
		description: deno.description,
		license: deno.license,
		repository: {
			type: "git",
			url: "git+https://github.com/NMNMCC/sli",
		},
	},
	postBuild() {
		Deno.copyFileSync("LICENSE", out + "/LICENSE")
		Deno.copyFileSync("README.md", out + "/README.md")
	},
})
