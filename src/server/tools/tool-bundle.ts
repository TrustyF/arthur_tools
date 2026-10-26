import "server-only";
import type { Tool } from "@prisma/client";
import AdmZip from "adm-zip";
import sharp from "sharp";
import { toolFileName } from "@/lib/tool-language";

// Everything lives under packages/ so the zip extracts straight into the user's
// Houdini folder: the .json is picked up at startup and points at the folder.
const NAME = "arthur_tools";
const ROOT = `packages/${NAME}`;

export const BUNDLE_FILE_NAME = `${NAME}.zip`;

export type BundleTool = Pick<
	Tool,
	| "slug"
	| "name"
	| "summary"
	| "language"
	| "context"
	| "houdiniIcon"
	| "customIcon"
	| "code"
	| "shortcut"
>;

// $HOUDINI_PACKAGE_PATH is the folder holding this .json (packages/).
const PACKAGE_JSON = `${JSON.stringify(
	{
		env: [{ ARTHUR_TOOLS: `$HOUDINI_PACKAGE_PATH/${NAME}` }],
		hpath: "$ARTHUR_TOOLS",
	},
	null,
	4,
)}\n`;

// Node type and Run Over token for each context in lib/tool-context.ts. Other
// contexts (parameter expressions, old values) get a plain Attribute Wrangle.
const WRANGLES: Record<string, { type: string; runOver?: string }> = {
	"Attribute Wrangle (points)": { type: "attribwrangle", runOver: "point" },
	"Attribute Wrangle (primitives)": {
		type: "attribwrangle",
		runOver: "primitive",
	},
	"Attribute Wrangle (vertices)": { type: "attribwrangle", runOver: "vertex" },
	"Attribute Wrangle (detail)": { type: "attribwrangle", runOver: "detail" },
	"Volume Wrangle": { type: "volumewrangle" },
	"Deformation Wrangle": { type: "deformationwrangle" },
	"POP Wrangle": { type: "popwrangle" },
	"Gas Field Wrangle": { type: "gasfieldwrangle" },
};

// Imported by the VEX shelf tools: adds a wrangle running the snippet from
// vex/include to the network shown in the network editor.
const SHELF_HELPER = `"""Shelf helpers for the arthur/tools bundle. Regenerated on every download."""
import hou


def add_wrangle(file_name, node_type, run_over=None):
    with open(hou.findFile("vex/include/" + file_name)) as f:
        code = f.read()

    editor = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
    if editor is None:
        hou.ui.displayMessage("Open a network editor first.")
        return
    parent = editor.pwd()
    try:
        node = parent.createNode(node_type)
    except hou.Error:
        hou.ui.displayMessage(
            "Can't add a %s inside %s. Go into a network where it belongs first."
            % (node_type, parent.path())
        )
        return
    node.setName(file_name.rsplit(".", 1)[0], unique_name=True)

    selected = [n for n in hou.selectedNodes() if n.parent() == parent]
    if selected:
        node.setInput(0, selected[0])
    node.moveToGoodPosition()

    node.parm("snippet").set(code)
    if run_over and node.parm("class") is not None:
        node.parm("class").set(run_over)
    # The wrangle's "Create spare parameters" button, for the snippet's sliders.
    try:
        import vexpressionmenu
        vexpressionmenu.createSpareParmsFromChCalls(node, "snippet")
    except Exception:
        pass
    node.setCurrent(True, clear_all_selected=True)
`;

const INSTALL_TXT = `arthur/tools: every published tool, on one Houdini shelf.

1. Extract this zip into your Houdini folder (e.g. Documents/houdini22.0).
   It adds packages/${NAME}.json and the packages/${NAME} folder.
2. Restart Houdini.
3. On any shelf set, click the + tab > Shelves > Arthur tools.

To update, delete packages/${NAME} and extract a fresh download the same way.
`;

function xmlAttr(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

// "]]>" would end the section early; split it across two sections.
function cdata(value: string): string {
	return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function shelfToolName(slug: string): string {
	return `${NAME}_${slug.replaceAll("-", "_")}`;
}

function shelfScript(tool: BundleTool): string {
	const fileName = toolFileName(tool.slug, tool.language);
	if (tool.language === "PYTHON") {
		// Same call the help page tells people to put in their own shelf tools.
		const moduleName = fileName.replace(/\.py$/, "");
		return `import runpy\nrunpy.run_module(${JSON.stringify(moduleName)})\n`;
	}
	const wrangle = WRANGLES[tool.context] ?? { type: "attribwrangle" };
	const args = [fileName, wrangle.type, wrangle.runOver]
		.filter((arg) => arg !== undefined)
		.map((arg) => JSON.stringify(arg))
		.join(", ");
	return `import ${NAME}_shelf\n${NAME}_shelf.add_wrangle(${args})\n`;
}

function shelfIcon(tool: BundleTool): string {
	if (tool.customIcon) return `$ARTHUR_TOOLS/icons/${tool.slug}.png`;
	if (tool.houdiniIcon) return tool.houdiniIcon;
	return tool.language === "PYTHON" ? "MISC_python" : "SOP_attribwrangle";
}

function shelfFile(tools: BundleTool[]): string {
	const members = tools
		.map((tool) => `    <memberTool name="${shelfToolName(tool.slug)}"/>`)
		.join("\n");
	const definitions = tools
		.map(
			(
				tool,
			) => `  <tool name="${shelfToolName(tool.slug)}" label="${xmlAttr(tool.name)}" icon="${xmlAttr(shelfIcon(tool))}">
    <helpText>${cdata(
			tool.shortcut
				? `${tool.summary}

Suggested shortcut: ${tool.shortcut}`
				: tool.summary,
		)}</helpText>
    <script scriptType="python">${cdata(shelfScript(tool))}</script>
  </tool>`,
		)
		.join("\n\n");
	return `<?xml version="1.0" encoding="UTF-8"?>
<shelfDocument>
  <toolshelf name="${NAME}" label="Arthur tools">
${members}
  </toolshelf>

${definitions}
</shelfDocument>
`;
}

// The whole bundle as a zip, built fresh from the given tools.
export async function buildBundle(tools: BundleTool[]): Promise<Buffer> {
	const zip = new AdmZip();
	const add = (path: string, content: string | Buffer) =>
		zip.addFile(
			path,
			typeof content === "string" ? Buffer.from(content) : content,
		);

	add(`packages/${NAME}.json`, PACKAGE_JSON);
	add(`${ROOT}/INSTALL.txt`, INSTALL_TXT);
	add(`${ROOT}/scripts/python/${NAME}_shelf.py`, SHELF_HELPER);
	add(`${ROOT}/toolbar/${NAME}.shelf`, shelfFile(tools));

	for (const tool of tools) {
		const fileName = toolFileName(tool.slug, tool.language);
		const dir = tool.language === "PYTHON" ? "scripts/python" : "vex/include";
		add(`${ROOT}/${dir}/${fileName}`, `${tool.code}\n`);
		// Stored as WebP; PNG is what Houdini's icon loader reliably reads.
		if (tool.customIcon) {
			add(
				`${ROOT}/icons/${tool.slug}.png`,
				await sharp(Buffer.from(tool.customIcon)).png().toBuffer(),
			);
		}
	}
	return zip.toBuffer();
}
