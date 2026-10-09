import { CARD_DROP_CHANCE, TRADING_CARDS, isComplete, type CardCollection, type TradingCard } from "../cards";

export interface CardDrop {
  card: TradingCard;
  collection: CardCollection;
  complete: boolean;
}

export function normaliseCollection(value: unknown): CardCollection {
  if (!value || typeof value !== "object") return { cards: [] };
  const { cards, craftedAt } = value as Partial<CardCollection>;
  const known = new Set(TRADING_CARDS.map((card) => card.id));
  const ids = Array.isArray(cards) ? [...new Set(cards.filter((id) => typeof id === "string" && known.has(id)))] : [];
  return typeof craftedAt === "string" ? { cards: ids, craftedAt } : { cards: ids };
}

export function rollCardDrop(collection: CardCollection, roll: number, pick: number): CardDrop | null {
  if (!(roll < CARD_DROP_CHANCE)) return null;
  const missing = TRADING_CARDS.filter((card) => !collection.cards.includes(card.id));
  if (missing.length === 0) return null;
  const index = Math.min(missing.length - 1, Math.max(0, Math.floor(pick * missing.length)));
  const card = missing[index];
  const next: CardCollection = { ...collection, cards: [...collection.cards, card.id] };
  return { card, collection: next, complete: isComplete(next) };
}
