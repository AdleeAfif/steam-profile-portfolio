import { STORAGE_KEYS, readJson, writeJson } from "../../lib/client/storage";
import { showToast } from "../../lib/client/toast";
import { CARDS_CHANGED_EVENT } from "../../lib/cards";
import { normaliseCollection, rollCardDrop } from "../../lib/eggs/cards";

export function cardDrop(): void {
  const current = normaliseCollection(readJson<unknown>(STORAGE_KEYS.cards, null));
  const drop = rollCardDrop(current, Math.random(), Math.random());
  if (!drop) return;
  writeJson(STORAGE_KEYS.cards, drop.collection);
  window.dispatchEvent(new CustomEvent(CARDS_CHANGED_EVENT, { detail: drop.collection }));
  window.setTimeout(() => {
    showToast({
      title: `You received a trading card: ${drop.card.name}`,
      body: drop.complete
        ? `All ${drop.collection.cards.length} cards collected! Visit your badges page to craft.`
        : `${drop.card.glyph} ${drop.card.caption}`,
      tone: "success",
      durationMs: 7000,
    });
  }, 2500);
}
