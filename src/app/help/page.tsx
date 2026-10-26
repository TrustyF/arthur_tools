import { Info } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/tools/copy-button";
import { SHOW_BUNDLE } from "@/lib/bundle";
import styles from "./help.module.sass";

export const metadata: Metadata = {
	title: "How to use these tools",
	description:
		"Putting the Python scripts on a Houdini shelf and the VEX snippets in a wrangle, by pasting or from the downloaded files.",
};

// A Houdini menu item, button or tab name.
function Ui({ children }: { children: ReactNode }) {
	return <span className={styles.ui}>{children}</span>;
}

function Snippet({ code }: { code: string }) {
	return (
		<div className={styles.snippet}>
			<pre>{code}</pre>
			<CopyButton text={code} />
		</div>
	);
}

function Note({ children }: { children: ReactNode }) {
	return (
		<p className={styles.note}>
			<Info size={16} aria-hidden />
			<span>{children}</span>
		</p>
	);
}

// One way of installing: a titled card of numbered steps.
function Method({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className={styles.method}>
			<h3>{title}</h3>
			{children}
		</div>
	);
}

// Section ids are linked from tool pages (HELP_ANCHOR in lib/tool-language.ts).
export default function HelpPage() {
	return (
		<article className={styles.page}>
			<h1>How to use these tools</h1>
			<p className={styles.lead}>
				Python scripts go on a shelf, VEX snippets go in a wrangle. Paste the
				code for a quick setup, or save the downloaded file in your Houdini
				folder to keep one copy you can update.
			</p>
			<nav className={styles.jump} aria-label="On this page">
				{SHOW_BUNDLE && <a href="#bundle">All tools at once</a>}
				<a href="#python">Python scripts</a>
				<a href="#vex">VEX snippets</a>
				<a href="#folder">Your Houdini folder</a>
			</nav>

			{SHOW_BUNDLE && (
				<section id="bundle">
					<h2>All tools at once</h2>
					<Method title="One shelf, every tool">
						<ol className={styles.steps}>
							<li>
								<a href="/download" download>
									Download all tools
								</a>{" "}
								(<code>arthur_tools.zip</code>).
							</li>
							<li>
								Extract it into your <a href="#folder">Houdini folder</a>. It
								adds <code>packages/arthur_tools.json</code> and a{" "}
								<code>packages/arthur_tools</code> folder.
							</li>
							<li>Restart Houdini.</li>
							<li>
								On a shelf set, click the <Ui>+</Ui> tab › <Ui>Shelves</Ui> ›{" "}
								<Ui>Arthur tools</Ui>.
							</li>
						</ol>
						<Note>
							VEX buttons add a wrangle with the snippet to the network
							you&apos;re in, wired to the selected node. To update, delete{" "}
							<code>packages/arthur_tools</code> and extract a fresh download.
						</Note>
					</Method>
				</section>
			)}

			<section id="python" className={styles.python}>
				<h2>Python scripts</h2>
				<Method title="Paste it">
					<ol className={styles.steps}>
						<li>
							Right-click a shelf › <Ui>New Tool…</Ui>
						</li>
						<li>
							Paste the code on the <Ui>Script</Ui> tab.
						</li>
						<li>
							Set a label and icon on the <Ui>Options</Ui> tab.
						</li>
					</ol>
				</Method>
				<Method title="From the file">
					<ol className={styles.steps}>
						<li>
							Save the <code>.py</code> file in <code>scripts/python</code>{" "}
							inside your <a href="#folder">Houdini folder</a>.
						</li>
						<li>
							Make a shelf tool as above, with this as its script (use the
							file&apos;s name):
							<Snippet
								code={`import runpy
runpy.run_module("padded_netbox")`}
							/>
						</li>
					</ol>
					<Note>To update the tool, replace the file.</Note>
				</Method>
			</section>

			<section id="vex" className={styles.vex}>
				<h2>VEX snippets</h2>
				<Method title="From the file">
					<ol className={styles.steps}>
						<li>
							Save the <code>.vfl</code> file in <code>vex/include</code> inside
							your <a href="#folder">Houdini folder</a>.
						</li>
						<li>
							In a wrangle, include it by name:
							<Snippet code={`#include "scale_by_noise.vfl"`} />
						</li>
					</ol>
					<Note>
						If <Ui>Create spare parameters</Ui> doesn&apos;t add the
						snippet&apos;s sliders this way, paste the code instead.
					</Note>
				</Method>
			</section>

			<section id="folder">
				<h2>Your Houdini folder</h2>
				<table className={styles.table}>
					<tbody>
						<tr>
							<th>Windows</th>
							<td>
								<code>Documents\houdini22.0</code>
							</td>
						</tr>
						<tr>
							<th>macOS</th>
							<td>
								<code>~/Library/Preferences/houdini/22.0</code>
							</td>
						</tr>
						<tr>
							<th>Linux</th>
							<td>
								<code>~/houdini22.0</code>
							</td>
						</tr>
					</tbody>
				</table>
				<Note>
					Use your own version number. Create <code>scripts/python</code> or{" "}
					<code>vex/include</code> if they don&apos;t exist yet, then restart
					Houdini.
				</Note>

				<h3>Keeping tools somewhere else</h3>
				<p>For a synced drive or a repo instead of the Houdini folder:</p>
				<ol className={styles.steps}>
					<li>
						Add a package file, e.g. <code>packages/arthur_tools.json</code> in
						your Houdini folder:
						<Snippet code={`{ "hpath": "D:/houdini/arthur_tools" }`} />
					</li>
					<li>
						Put files in that folder&apos;s <code>scripts/python</code> and{" "}
						<code>vex/include</code>, as you would in the Houdini folder.
					</li>
					<li>Restart Houdini to load it.</li>
				</ol>
			</section>
		</article>
	);
}
