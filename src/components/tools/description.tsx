import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import styles from "./description.module.sass";

// Tool descriptions are Markdown (images/GIFs via ![alt](/media/…)). Raw HTML
// isn't rendered, and remark-breaks keeps single line breaks as written.
export function Description({ markdown }: { markdown: string }) {
	return (
		<div className={styles.description}>
			<Markdown
				remarkPlugins={[remarkBreaks]}
				components={{
					a: ({ href, title, children }) => (
						<a
							href={href}
							title={title}
							target="_blank"
							rel="noopener noreferrer">
							{children}
						</a>
					),
					img: ({ src, alt, title }) => (
						// next/image needs dimensions up front; Markdown images have none.
						// eslint-disable-next-line @next/next/no-img-element
						<img src={src} alt={alt ?? ""} title={title} loading="lazy" />
					),
				}}>
				{markdown}
			</Markdown>
		</div>
	);
}
