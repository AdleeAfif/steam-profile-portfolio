import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { SkillCategory } from "../../lib/api/types";
import { ItemPanel } from "../inventory/ItemPanel";
import { ItemTile } from "../inventory/ItemTile";
import {
  CATEGORIES,
  filterItems,
  parseState,
  stateSearch,
  type InventoryItem,
  type InventoryTab,
} from "../inventory/filter";

interface Props {
  items: InventoryItem[];
  tabs: InventoryTab[];
  initialTab: string;
  initialItem: string | null;
  projectsUnavailable: boolean;
}

type PendingFocus = { kind: "panel" } | { kind: "tile"; id: string } | null;

const tabDomId = (id: string) => `inv-tab-${id}`;

export default function Inventory({ items, tabs, initialTab, initialItem, projectsUnavailable }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [itemId, setItemId] = useState<string | null>(initialItem);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SkillCategory | "">("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<PendingFocus>(null);

  const visible = useMemo(() => filterItems(items, { tab, query, category }), [items, tab, query, category]);
  const selected = useMemo(() => items.find((i) => i.id === itemId) ?? null, [items, itemId]);

  const open = useCallback((id: string) => {
    pendingFocus.current = { kind: "panel" };
    setItemId(id);
  }, []);

  const close = useCallback(() => {
    if (itemId) pendingFocus.current = { kind: "tile", id: itemId };
    setItemId(null);
  }, [itemId]);

  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target?.kind === "panel") closeRef.current?.focus();
    else if (target?.kind === "tile") document.getElementById(`inv-item-${target.id}`)?.focus();
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [itemId, close]);

  useEffect(() => {
    const search = stateSearch({ tab, item: itemId });
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}${window.location.hash}`);
    }
  }, [tab, itemId]);

  useEffect(() => {
    const onPop = () => {
      const state = parseState(new URLSearchParams(window.location.search), tabs, items);
      setTab(state.tab);
      setItemId(state.item);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [tabs, items]);

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === tab);
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const id = tabs[next].id;
    setTab(id);
    document.getElementById(tabDomId(id))?.focus();
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
  };

  return (
    <div className="bg-black/30">
      <div
        role="tablist"
        aria-label="Inventory by company"
        onKeyDown={onTabKey}
        className="flex gap-1 overflow-x-auto border-b border-black/60 bg-black/20 px-2 pt-2"
      >
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={tabDomId(t.id)}
              aria-selected={active}
              aria-controls="inventory-tabpanel"
              tabIndex={active ? 0 : -1}
              title={`${t.name} (${t.count})`}
              onClick={() => setTab(t.id)}
              className={`flex max-w-56 shrink-0 cursor-pointer items-center gap-1.5 rounded-t-sm px-3 py-2 text-sm whitespace-nowrap transition ${
                active
                  ? "bg-[#2a475e] text-white"
                  : "bg-black/20 text-steam-muted hover:bg-[#2a475e]/50 hover:text-steam-text"
              }`}
            >
              <span className="truncate">{t.name}</span>
              <span className={active ? "text-steam-accent" : "text-steam-muted"}>({t.count})</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="inventory-tabpanel" aria-labelledby={tabDomId(tab)} className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="min-w-48 flex-1">
            <span className="sr-only">Search items</span>
            <input
              type="search"
              className="steam-input"
              placeholder="Search name or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              className="steam-input w-auto"
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory | "")}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite" className="ml-auto text-sm text-steam-muted">
            {visible.length} {visible.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className={selected ? "md:grid md:grid-cols-[1fr_320px] md:items-start md:gap-4" : undefined}>
          {visible.length > 0 ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1.5">
              {visible.map((item) => (
                <li key={item.id}>
                  <ItemTile item={item} selected={item.id === itemId} onSelect={open} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center text-sm text-steam-muted">
              <p className="italic">No items match your filters.</p>
              {(query || category) && (
                <button type="button" className="btn-steam btn-blue mt-3" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}
          {selected && (
            <ItemPanel item={selected} projectsUnavailable={projectsUnavailable} onClose={close} closeRef={closeRef} />
          )}
        </div>
      </div>
    </div>
  );
}
