"use client";

import {
	type Active,
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragMoveEvent,
	DragOverlay,
	type DragOverEvent,
	type DragStartEvent,
	KeyboardSensor,
	type Modifier,
	MouseSensor,
	type Over,
	pointerWithin,
	TouchSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tool } from "@prisma/client";
import { Download, Heart, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import styles from "./shelf-builder.module.sass";
import { ToolIcon } from "./tool-icon";

type ShelfTool = Pick<
	Tool,
	| "slug"
	| "name"
	| "summary"
	| "language"
	| "houdiniIcon"
	| "customIconDate"
	| "isPinned"
>;

type ShelfBuilderProps = {
	tools: ShelfTool[];
};

// Drop target id for the shelf row itself (its buttons are sortable by slug).
const SHELF = "shelf";
// List entries are draggable as "list:<slug>", so they can't clash with the
// shelf's buttons, which use the bare slug.
const LIST_PREFIX = "list:";

type Drag = { slug: string; from: "list" | "shelf" };

// This browser's last shelf (slugs in order), so a return visit can update it.
const STORAGE_KEY = "arthur-tools:shelf";

// Saved slugs that are still published tools; storage can be blocked or junk.
function loadShelf(known: ReadonlySet<string>): string[] {
	try {
		const saved: unknown = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? "[]",
		);
		return Array.isArray(saved)
			? saved.filter((slug): slug is string => known.has(slug))
			: [];
	} catch {
		return [];
	}
}

function dragOf(active: Active): Drag {
	const id = String(active.id);
	return id.startsWith(LIST_PREFIX)
		? { slug: id.slice(LIST_PREFIX.length), from: "list" }
		: { slug: id, from: "shelf" };
}

// Mouse/touch: the shelf button under the pointer, else the shelf row, else
// nothing (so dropping elsewhere removes). Keyboard has no pointer: nearest.
const collision: CollisionDetection = (args) => {
	if (!args.pointerCoordinates) return closestCenter(args);
	const hits = pointerWithin(args);
	const buttons = hits.filter((hit) => hit.id !== SHELF);
	return buttons.length > 0 ? buttons : hits;
};

// Where the pointer was when the drag started; undefined for keyboard drags.
function pointerStart(
	event: Event | null,
): { x: number; y: number } | undefined {
	const point =
		event instanceof MouseEvent
			? event
			: event instanceof TouchEvent
				? event.touches[0]
				: undefined;
	return point && { x: point.clientX, y: point.clientY };
}

// The pointer's x during a drag; undefined for keyboard drags.
function pointerX({ activatorEvent, delta }: DragMoveEvent) {
	const start = pointerStart(activatorEvent);
	return start && start.x + delta.x;
}

// Puts the dragged copy's centre on the pointer, wherever the tool was grabbed
// (list rows are much wider than a shelf button). Keyboard drags: unchanged.
const centreOnPointer: Modifier = ({
	activatorEvent,
	draggingNodeRect,
	overlayNodeRect,
	transform,
}) => {
	const start = pointerStart(activatorEvent);
	if (!start || !draggingNodeRect || !overlayNodeRect) return transform;
	return {
		...transform,
		x:
			transform.x + start.x - draggingNodeRect.left - overlayNodeRect.width / 2,
		y:
			transform.y + start.y - draggingNodeRect.top - overlayNodeRect.height / 2,
	};
};

// Where a list tool lands: before or after the shelf button it's over (by which
// half the pointer is in), or at the end over the row's empty space.
function insertIndex(order: string[], over: Over, x: number | undefined) {
	const overId = String(over.id);
	const index = order.indexOf(overId);
	if (overId === SHELF || index < 0) return order.length;
	const isAfter = x !== undefined && x > over.rect.left + over.rect.width / 2;
	return isAfter ? index + 1 : index;
}

// Drag tools from the list onto the shelf row (or click them), drag to reorder,
// drag off to remove, then download just those, in order (/download?tools=).
export function ShelfBuilder({ tools }: ShelfBuilderProps) {
	// Slugs in shelf order.
	// Browser-only component (shelf-builder-loader.tsx), so storage is readable.
	const [picked, setPicked] = useState(() =>
		loadShelf(new Set(tools.map((tool) => tool.slug))),
	);
	const [drag, setDrag] = useState<Drag>();
	// Whether a dragged shelf button is still over the shelf (else it'll go).
	const [isOverShelf, setIsOverShelf] = useState(true);
	// The order before a drag, for Escape.
	const beforeDrag = useRef<string[]>([]);
	const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
		} catch {
			// Storage blocked (private mode, site data off): just don't remember.
		}
	}, [picked]);

	// Mouse: a few pixels of movement first, so clicks still click. Touch: a
	// short press first, so the page still scrolls.
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 8 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function toggle(slug: string) {
		setPicked((current) =>
			current.includes(slug)
				? current.filter((s) => s !== slug)
				: [...current, slug],
		);
	}

	function onDragStart({ active }: DragStartEvent) {
		beforeDrag.current = picked;
		setDrag(dragOf(active));
		setIsOverShelf(true);
	}

	// Shelf buttons dragged off the shelf fade, to show dropping removes them.
	function onDragOver({ active, over }: DragOverEvent) {
		if (dragOf(active).from === "shelf") setIsOverShelf(over !== null);
	}

	// A list tool sits on the shelf while hovering there (buttons make room) and
	// comes off when it leaves. Runs on every move so a button's middle counts.
	function onDragMove(event: DragMoveEvent) {
		const { slug, from } = dragOf(event.active);
		if (from === "shelf") return;
		const { over } = event;
		setPicked((current) => {
			if (over && String(over.id) === slug) return current;
			const without = current.filter((s) => s !== slug);
			if (!over) return without.length === current.length ? current : without;
			const next = [...without];
			next.splice(insertIndex(without, over, pointerX(event)), 0, slug);
			return next.join() === current.join() ? current : next;
		});
	}

	function onDragEnd({ active, over }: DragEndEvent) {
		const { slug, from } = dragOf(active);
		setDrag(undefined);
		// From the list, onDragMove has already placed or removed it.
		if (from === "list") return;
		if (!over) {
			setPicked((current) => current.filter((s) => s !== slug));
			return;
		}
		const overId = String(over.id);
		if (overId === slug || overId === SHELF) return;
		setPicked((current) =>
			arrayMove(current, current.indexOf(slug), current.indexOf(overId)),
		);
	}

	function onDragCancel() {
		setPicked(beforeDrag.current);
		setDrag(undefined);
	}

	const count = picked.length;
	const dragged = drag && bySlug.get(drag.slug);

	return (
		<DndContext
			// Fixed id: dnd-kit's generated ids differ between server and client.
			id="shelf-builder"
			sensors={sensors}
			collisionDetection={collision}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragMove={onDragMove}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}>
			<div className={styles.toolbar}>
				<button
					type="button"
					className={styles.clear}
					onClick={() => setPicked([])}
					disabled={count === 0}>
					Clear
				</button>
				{count > 0 ? (
					// Plain <a>: a file download, not a page to prefetch.
					<a
						href={`/download?tools=${picked.map(encodeURIComponent).join(",")}`}
						className={styles.download}
						download>
						<Download size={15} aria-hidden />
						Download ({count})
					</a>
				) : (
					<span className={styles.download} aria-disabled>
						<Download size={15} aria-hidden />
						Download
					</span>
				)}
			</div>

			<ShelfRow isDragging={drag !== undefined}>
				{count === 0 ? (
					<p className={styles.shelfEmpty}>
						Drag tools here, or click them below.
					</p>
				) : (
					<SortableContext items={picked} strategy={rectSortingStrategy}>
						<ol className={styles.shelfItems}>
							{picked.map((slug) => {
								const tool = bySlug.get(slug);
								if (!tool) return null;
								const isGhost = drag?.slug === slug;
								return (
									<ShelfItem
										key={slug}
										tool={tool}
										isGhost={isGhost}
										isLeaving={isGhost && drag.from === "shelf" && !isOverShelf}
										onRemove={() => toggle(slug)}
									/>
								);
							})}
						</ol>
					</SortableContext>
				)}
			</ShelfRow>
			<p className={styles.hint}>
				Drag to reorder. Drag a tool off the shelf to remove it.
			</p>

			<ul className={styles.list}>
				{tools.map((tool) => (
					<ListItem
						key={tool.slug}
						tool={tool}
						isOnShelf={picked.includes(tool.slug)}
						onToggle={() => toggle(tool.slug)}
					/>
				))}
			</ul>

			{/* Follows the pointer; the original stays in place as a ghost. */}
			<DragOverlay dropAnimation={null} modifiers={[centreOnPointer]}>
				{dragged && <ShelfButton tool={dragged} className={styles.lifted} />}
			</DragOverlay>
		</DndContext>
	);
}

// The drop area. Its own component: useDroppable must sit inside DndContext.
function ShelfRow({
	isDragging,
	children,
}: {
	isDragging: boolean;
	children: ReactNode;
}) {
	const { setNodeRef } = useDroppable({ id: SHELF });
	return (
		<div
			ref={setNodeRef}
			className={
				isDragging ? `${styles.shelf} ${styles.shelfActive}` : styles.shelf
			}>
			{children}
		</div>
	);
}

// Icon over label, like a button on a Houdini shelf.
function ShelfButton({
	tool,
	className,
}: {
	tool: ShelfTool;
	className?: string | undefined;
}) {
	return (
		<div className={className ? `${styles.item} ${className}` : styles.item}>
			<ToolIcon tool={tool} size={32} />
			<span>{tool.name}</span>
		</div>
	);
}

function ShelfItem({
	tool,
	isGhost,
	isLeaving,
	onRemove,
}: {
	tool: ShelfTool;
	// Being dragged (the overlay shows it under the pointer).
	isGhost: boolean;
	// Being dragged off the shelf: dropping now removes it.
	isLeaving: boolean;
	onRemove: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: tool.slug });
	const state = isLeaving ? styles.leaving : isGhost ? styles.ghost : "";

	return (
		<li
			ref={setNodeRef}
			// dnd-kit slides the other buttons aside with a transform.
			style={{ transform: CSS.Translate.toString(transform), transition }}
			className={`${styles.item} ${styles.sortable} ${state}`}
			{...attributes}
			{...listeners}>
			<ToolIcon tool={tool} size={32} />
			<span>{tool.name}</span>
			<button
				type="button"
				className={styles.remove}
				onClick={onRemove}
				// Keys here would otherwise start a keyboard drag of the button.
				onKeyDown={(e) => e.stopPropagation()}
				aria-label={`Remove ${tool.name}`}
				title="Remove">
				<X size={12} />
			</button>
		</li>
	);
}

// A tool in the list: drag it onto the shelf, or click to add or remove it.
function ListItem({
	tool,
	isOnShelf,
	onToggle,
}: {
	tool: ShelfTool;
	isOnShelf: boolean;
	onToggle: () => void;
}) {
	const { attributes, listeners, setNodeRef } = useDraggable({
		id: `${LIST_PREFIX}${tool.slug}`,
		disabled: isOnShelf,
	});

	return (
		<li>
			<button
				type="button"
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				// Enter and Space click the button rather than start a keyboard drag.
				onKeyDown={undefined}
				onClick={onToggle}
				aria-pressed={isOnShelf}
				className={isOnShelf ? styles.onShelf : undefined}>
				<ToolIcon tool={tool} size={36} className={styles.icon} />
				<span className={styles.name}>
					{tool.name}
					{tool.isPinned && (
						<Heart
							size={13}
							fill="currentColor"
							className={styles.pin}
							aria-label="Pinned"
						/>
					)}
					{isOnShelf && <span className={styles.badge}>On shelf</span>}
				</span>
				{tool.summary && <span className={styles.summary}>{tool.summary}</span>}
			</button>
		</li>
	);
}
