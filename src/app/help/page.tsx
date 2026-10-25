import type { Metadata } from "next";
import styles from "./help.module.sass";

export const metadata: Metadata = {
	title: "How to use these tools",
	description:
		"Putting the Python scripts on a Houdini shelf and the VEX snippets in a wrangle, by pasting or from the downloaded files.",
};

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

			<section id="python">
				<h2>Python scripts</h2>
				<h3>Paste it</h3>
				<p>
					Right-click a shelf › <span className={styles.ui}>New Tool…</span>,
					paste the code on the <span className={styles.ui}>Script</span> tab,
					and set a label and icon on <span className={styles.ui}>Options</span>{" "}
					(the tool page lists the icon name).
				</p>
				<h3>From the file</h3>
				<ol>
					<li>
						Save the <code>.py</code> file in <code>scripts/python</code> inside
						your <a href="#folder">Houdini folder</a>.
					</li>
					<li>
						Make a shelf tool as above whose script runs it by name:
						<pre>{`import runpy
runpy.run_module("padded_netbox")`}</pre>
					</li>
				</ol>
				<p>Replace the file to update the tool.</p>
			</section>

			<section id="vex">
				<h2>VEX snippets</h2>
				<h3>Paste it</h3>
				<p>
					Add an <b>Attribute Wrangle</b>, set{" "}
					<span className={styles.ui}>Run Over</span> to the tool&apos;s
					context, paste the code, then click{" "}
					<span className={styles.ui}>Create spare parameters</span> (next to
					the code) to get its sliders.
				</p>
				<h3>From the file</h3>
				<p>
					Save the <code>.vfl</code> file in <code>vex/include</code> inside
					your <a href="#folder">Houdini folder</a>, then in a wrangle write:
				</p>
				<pre>{`#include "scale_by_noise.vfl"`}</pre>
				<p>
					If <span className={styles.ui}>Create spare parameters</span>{" "}
					doesn&apos;t add the snippet&apos;s sliders this way, paste the code
					instead.
				</p>
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
				<p>
					Use your own version number. Create <code>scripts/python</code> or{" "}
					<code>vex/include</code> if they don&apos;t exist yet, then restart
					Houdini.
				</p>
				<h3>Keeping tools somewhere else</h3>
				<p>
					To keep them in another folder (a synced drive, a repo), add a package
					file, e.g. <code>packages/arthur_tools.json</code> in your Houdini
					folder:
				</p>
				<pre>{`{ "hpath": "D:/houdini/arthur_tools" }`}</pre>
				<p>
					That folder then works like your Houdini folder: put files in its{" "}
					<code>scripts/python</code> and <code>vex/include</code>. Restart
					Houdini to load it.
				</p>
			</section>
		</article>
	);
}
