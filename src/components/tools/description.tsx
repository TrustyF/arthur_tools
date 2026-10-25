import type { CSSProperties } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { parseImageAlt } from "@/lib/image-size";
import styles from "./description.module.sass";

// Tool descriptions are Markdown (images/GIFs via ![alt|size](/media/…), see
// lib/image-size.ts). Raw HTML isn't rendered; remark-breaks keeps line breaks.
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
					img: ({ src, alt: rawAlt, title }) => {
						const { alt, maxWidth, maxHeight } = parseImageAlt(rawAlt ?? "");
						// Custom properties, so the stylesheet still caps at the column width.
						const style = {
							...(maxWidth ? { "--max-width": `${maxWidth}px` } : {}),
							...(maxHeight ? { "--max-height": `${maxHeight}px` } : {}),
						} as CSSProperties;
						return (
							// next/image needs dimensions up front; Markdown images have none.
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={src}
								alt={alt}
								title={title}
								style={style}
								loading="lazy"
							/>
						);
					},
				}}>
				{markdown}
			</Markdown>
		</div>
	);
}
