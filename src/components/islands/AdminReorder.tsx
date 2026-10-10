import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type MouseEvent, type PointerEvent } from "react";

export interface ReorderRow {
  id: string;
  title: string;
  meta: string;
  color: string | null;
}

interface Props {
  collection: string;
  base: string;
  singular: string;
  ordered: boolean;
  rotatable: boolean;
  moved: string | null;
  rows: ReorderRow[];
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const sameOrder = (a: ReorderRow[], b: ReorderRow[]) => a.length === b.length && a.every((row, i) => row.id === b[i].id);

function moveTo(rows: ReorderRow[], id: string, target: number): ReorderRow[] {
  const from = rows.findIndex((row) => row.id === id);
  if (from < 0) return rows;
  const next = rows.slice();
  const [row] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, target)), 0, row);
  return next;
}

function errorText(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = body.error;
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  }
  return status === 0 ? "Could not reach the server." : `Request failed with status ${status}.`;
}

export default function AdminReorder({ collection, base, singular, ordered, rotatable, moved, rows: initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [hydrated, setHydrated] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [lastMoved, setLastMoved] = useState(moved);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [announcement, setAnnouncement] = useState("");
  const saved = useRef(initial);
  const dragStart = useRef<ReorderRow[] | null>(null);
  const pointerId = useRef<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const refocus = useRef<{ id: string; direction: "up" | "down" } | null>(null);

  useEffect(() => setHydrated(true), []);

  useLayoutEffect(() => {
    const target = refocus.current;
    if (!target || !listRef.current) return;
    const button = (direction: string) =>
      listRef.current?.querySelector<HTMLButtonElement>(`[data-step="${direction}"][data-row="${CSS.escape(target.id)}"]`);
    const preferred = button(target.direction);
    (preferred && !preferred.disabled ? preferred : button(target.direction === "up" ? "down" : "up"))?.focus();
  }, [rows]);

  const busy = save.kind === "saving";
  const canDrag = hydrated && ordered;

  async function persist(next: ReorderRow[], id: string) {
    const previous = saved.current;
    if (sameOrder(next, previous)) {
      setRows(previous);
      return;
    }
    const row = next.find((r) => r.id === id);
    const position = next.findIndex((r) => r.id === id) + 1;
    setRows(next);
    setLastMoved(id);
    setSave({ kind: "saving" });
    setAnnouncement(`Moving ${row?.title ?? id} to position ${position} of ${next.length}...`);

    let status = 0;
    let body: unknown = null;
    try {
      const res = await fetch(`/api/admin/${encodeURIComponent(collection)}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ids: next.map((r) => r.id) }),
        credentials: "same-origin",
      });
      status = res.status;
      body = await res.json().catch(() => null);
    } catch {
      status = 0;
    }

    if (status === 401) {
      window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (status >= 200 && status < 300) {
      saved.current = next;
      setSave({ kind: "saved" });
      setAnnouncement(`Saved. ${row?.title ?? id} is now at position ${position} of ${next.length}.`);
      return;
    }
    const message = errorText(body, status);
    setRows(previous);
    setSave({ kind: "error", message });
    setAnnouncement(`Order not saved: ${message} The previous order was restored.`);
  }

  function onStep(event: MouseEvent<HTMLButtonElement>, id: string, delta: -1 | 1) {
    event.preventDefault();
    if (busy) return;
    const index = rows.findIndex((r) => r.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= rows.length) return;
    refocus.current = { id, direction: delta < 0 ? "up" : "down" };
    void persist(moveTo(rows, id, target), id);
  }

  function hoverMove(id: string, overEl: Element | null, clientY: number) {
    const li = overEl?.closest<HTMLLIElement>("li[data-id]");
    if (!li || !listRef.current?.contains(li)) return;
    const overId = li.dataset.id;
    if (!overId || overId === id) return;
    setRows((current) => {
      const overIndex = current.findIndex((r) => r.id === overId);
      const fromIndex = current.findIndex((r) => r.id === id);
      if (overIndex < 0 || fromIndex < 0) return current;
      const rect = li.getBoundingClientRect();
      const after = clientY > rect.top + rect.height / 2;
      if (after && fromIndex === overIndex + 1) return current;
      if (!after && fromIndex === overIndex - 1) return current;
      const target = after ? overIndex + (fromIndex < overIndex ? 0 : 1) : overIndex - (fromIndex < overIndex ? 1 : 0);
      return moveTo(current, id, target);
    });
  }

  function startDrag(id: string) {
    refocus.current = null;
    dragStart.current = rows;
    setDragId(id);
    setSave((s) => (s.kind === "error" ? { kind: "idle" } : s));
  }

  function finishDrag(commit: boolean) {
    const id = dragId;
    const start = dragStart.current;
    dragStart.current = null;
    setDragId(null);
    if (!id || !start) return;
    if (commit) void persist(rows, id);
    else setRows(start);
  }

  function onDragStart(event: DragEvent<HTMLSpanElement>, id: string) {
    if (busy || pointerId.current !== null) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    const li = event.currentTarget.closest("li");
    if (li) event.dataTransfer.setDragImage(li, 16, 16);
    startDrag(id);
  }

  function onListDragOver(event: DragEvent<HTMLOListElement>) {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    hoverMove(dragId, event.target instanceof Element ? event.target : null, event.clientY);
  }

  function onListDrop(event: DragEvent<HTMLOListElement>) {
    if (!dragId) return;
    event.preventDefault();
    finishDrag(true);
  }

  function onPointerDown(event: PointerEvent<HTMLSpanElement>, id: string) {
    if (event.pointerType === "mouse" || busy) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId.current = event.pointerId;
    startDrag(id);
  }

  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (pointerId.current !== event.pointerId || !dragId) return;
    hoverMove(dragId, document.elementFromPoint(event.clientX, event.clientY), event.clientY);
  }

  function onPointerEnd(event: PointerEvent<HTMLSpanElement>, commit: boolean) {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    finishDrag(commit);
  }

  return (
    <div className="flex flex-col gap-2">
      {canDrag && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-steam-muted">
          <p>Drag a row by its handle, or use the arrow buttons, to change the display order. Changes save immediately.</p>
          <p aria-hidden="true" className={save.kind === "saved" ? "text-[#d2efa9]" : undefined}>
            {save.kind === "saving" ? "Saving..." : save.kind === "saved" ? "Saved" : ""}
          </p>
        </div>
      )}
      {save.kind === "error" && (
        <div role="alert" className="rounded-sm border border-[#b33] bg-[#b33]/20 px-4 py-3 text-sm text-[#ffb3b3]">
          <span className="font-semibold">Error:</span> Order not saved: {save.message} The previous order was restored.
        </div>
      )}
      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>
      <ol
        ref={listRef}
        className="flex flex-col gap-1"
        aria-busy={busy || undefined}
        onDragOver={canDrag ? onListDragOver : undefined}
        onDrop={canDrag ? onListDrop : undefined}
      >
        {rows.map((row, i) => {
          const href = `${base}/${encodeURIComponent(row.id)}`;
          const highlighted = lastMoved === row.id;
          return (
            <li
              key={row.id}
              id={`item-${row.id}`}
              data-id={row.id}
              className={[
                "steam-panel flex flex-wrap items-center gap-3 py-2!",
                highlighted ? "outline outline-1 outline-steam-accent" : "",
                dragId === row.id ? "opacity-60 outline outline-1 outline-dashed outline-steam-accent" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {canDrag && (
                <span
                  aria-hidden="true"
                  draggable={!busy}
                  title="Drag to reorder"
                  className={`select-none px-1 text-steam-muted touch-none ${busy ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                  onDragStart={(e) => onDragStart(e, row.id)}
                  onDragEnd={() => finishDrag(false)}
                  onPointerDown={(e) => onPointerDown(e, row.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={(e) => onPointerEnd(e, true)}
                  onPointerCancel={(e) => onPointerEnd(e, false)}
                >
                  ⠿
                </span>
              )}
              {ordered && <span className="w-6 text-right text-xs text-steam-muted">{i + 1}</span>}
              {row.color && <span aria-hidden="true" className="inline-block h-4 w-4 rounded-sm" style={{ background: row.color }} />}
              <div className="min-w-0 flex-1">
                <a href={href} className="font-semibold" draggable={false}>
                  {row.title}
                </a>
                <span className="ml-2 text-xs text-steam-muted">{row.id}</span>
                <p className="truncate text-xs text-steam-muted">{row.meta}</p>
              </div>
              <form method="post" className="flex flex-wrap items-center gap-1">
                <input type="hidden" name="id" value={row.id} />
                {ordered && (
                  <>
                    <button
                      type="submit"
                      name="action"
                      value="up"
                      data-step="up"
                      data-row={row.id}
                      className="btn-steam btn-blue px-2!"
                      disabled={i === 0}
                      aria-label={`Move ${row.title} up`}
                      title="Move up"
                      onClick={hydrated ? (e) => onStep(e, row.id, -1) : undefined}
                    >
                      ↑
                    </button>
                    <button
                      type="submit"
                      name="action"
                      value="down"
                      data-step="down"
                      data-row={row.id}
                      className="btn-steam btn-blue px-2!"
                      disabled={i === rows.length - 1}
                      aria-label={`Move ${row.title} down`}
                      title="Move down"
                      onClick={hydrated ? (e) => onStep(e, row.id, 1) : undefined}
                    >
                      ↓
                    </button>
                  </>
                )}
                <a href={href} className="btn-steam btn-blue" aria-label={`Edit ${row.title}`}>
                  Edit
                </a>
                {rotatable && (
                  <button
                    type="submit"
                    name="action"
                    value="rotate"
                    className="btn-steam btn-blue"
                    data-confirm={`Rotate the API key for ${row.id}? The current key stops working immediately.`}
                    aria-label={`Rotate API key for ${row.title}`}
                  >
                    Rotate key
                  </button>
                )}
                <button
                  type="submit"
                  name="action"
                  value="delete"
                  className="btn-steam btn-blue hover:bg-[#b33]!"
                  data-confirm={`Delete ${singular} "${row.title}"? This cannot be undone.`}
                  aria-label={`Delete ${row.title}`}
                >
                  Delete
                </button>
              </form>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
