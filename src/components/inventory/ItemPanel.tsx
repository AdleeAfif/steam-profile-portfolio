import type { Ref } from "react";
import { rarity } from "../../lib/presentation/rarity";
import { ItemIcon } from "./ItemTile";
import type { InventoryItem } from "./filter";

interface Props {
  item: InventoryItem;
  projectsUnavailable: boolean;
  onClose: () => void;
  closeRef: Ref<HTMLButtonElement>;
}

export function ItemPanel({ item, projectsUnavailable, onClose, closeRef }: Props) {
  const r = rarity(item.tier);
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onClose} />
      <aside
        id="inventory-detail"
        role="dialog"
        aria-labelledby="inventory-detail-title"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto border-t-2 bg-[#16202d] shadow-2xl shadow-black md:sticky md:top-4 md:z-auto md:max-h-[calc(100vh-2rem)] md:border-t-0 md:shadow-none"
        style={{ borderColor: r.colour }}
      >
        <div
          className="flex items-start gap-3 p-4"
          style={{ background: `linear-gradient(to bottom, ${r.colour}33, transparent)` }}
        >
          <div className="grid h-20 w-20 shrink-0 place-items-center bg-gradient-to-b from-[#3a4554] to-[#1c232d]" style={{ borderBottom: `3px solid ${r.colour}` }}>
            <ItemIcon key={item.id} item={item} size={56} className="h-14 w-14 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="inventory-detail-title" className="text-lg leading-tight font-medium text-white">
              {item.name}
            </h2>
            <p className="text-sm" style={{ color: r.colour }}>
              {r.name} {item.category}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="btn-steam btn-blue -mt-1 -mr-1 px-2 py-0.5 text-lg leading-none"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="space-y-4 px-4 pb-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-steam-muted">Rarity</dt>
            <dd className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5" style={{ background: r.colour }} />
              <span style={{ color: r.colour }}>{r.name}</span>
            </dd>
            <dt className="text-steam-muted">Category</dt>
            <dd>{item.category}</dd>
            <dt className="text-steam-muted">Proficiency</dt>
            <dd>{r.proficiency}</dd>
            <dt className="text-steam-muted">Years used</dt>
            <dd>
              {item.yearsLabel} <span className="text-steam-muted">(since {item.since})</span>
            </dd>
          </dl>

          {item.description && <p className="leading-relaxed whitespace-pre-line">{item.description}</p>}

          <section aria-labelledby="inventory-detail-companies">
            <h3 id="inventory-detail-companies" className="steam-panel-title mb-1 text-xs">
              Acquired at
            </h3>
            {item.companies.length > 0 ? (
              <ul className="space-y-1">
                {item.companies.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <a href={`/inventory?tab=${encodeURIComponent(c.id)}`}>{c.name}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-steam-muted italic">Not tied to a company.</p>
            )}
          </section>

          <section aria-labelledby="inventory-detail-projects">
            <h3 id="inventory-detail-projects" className="steam-panel-title mb-1 text-xs">
              Used in projects
            </h3>
            {projectsUnavailable ? (
              <p className="text-steam-muted italic">Unable to load projects.</p>
            ) : item.projects.length > 0 ? (
              <ul className="space-y-1">
                {item.projects.map((p) => (
                  <li key={p.id}>
                    <a href={`/games/${encodeURIComponent(p.id)}`}>{p.name}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-steam-muted italic">No projects use this item yet.</p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
