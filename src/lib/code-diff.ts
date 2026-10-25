import { structuredPatch } from "diff";

export type DiffRow =
	| { kind: "context"; oldNumber: number; newNumber: number }
	| { kind: "removed"; oldNumber: number }
	| { kind: "added"; newNumber: number };

export type DiffHunk = {
	// GitHub-style "@@ -12,7 +12,9 @@" header.
	header: string;
	rows: DiffRow[];
};

export type CodeDiff = { hunks: DiffHunk[]; added: number; removed: number };

const CONTEXT_LINES = 3;

// Git numbers an empty range from the line before it ("-0,0" for a new file).
function rangeStart(start: number, lines: number): number {
	return lines === 0 ? start - 1 : start;
}

// Line-level diff with a few unchanged lines around each change. Rows carry
// line numbers rather than text, so callers can render highlighted lines.
export function diffCode(oldCode: string, newCode: string): CodeDiff {
	// Both sides end in "\n" so a change to the last line isn't reported as a
	// "No newline at end of file" difference.
	const patch = structuredPatch(
		"",
		"",
		oldCode ? `${oldCode}\n` : "",
		`${newCode}\n`,
		"",
		"",
		{ context: CONTEXT_LINES },
	);

	let added = 0;
	let removed = 0;
	const hunks = patch.hunks.map((hunk): DiffHunk => {
		let oldNumber = hunk.oldStart;
		let newNumber = hunk.newStart;
		const rows: DiffRow[] = [];
		for (const line of hunk.lines) {
			if (line.startsWith("+")) {
				rows.push({ kind: "added", newNumber: newNumber++ });
				added++;
			} else if (line.startsWith("-")) {
				rows.push({ kind: "removed", oldNumber: oldNumber++ });
				removed++;
			} else if (line.startsWith(" ")) {
				rows.push({
					kind: "context",
					oldNumber: oldNumber++,
					newNumber: newNumber++,
				});
			}
		}
		return {
			header: `@@ -${rangeStart(hunk.oldStart, hunk.oldLines)},${hunk.oldLines} +${rangeStart(hunk.newStart, hunk.newLines)},${hunk.newLines} @@`,
			rows,
		};
	});

	return { hunks, added, removed };
}
