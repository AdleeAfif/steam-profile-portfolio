export interface TradingCard {
  id: string;
  name: string;
  caption: string;
  colour: string;
  glyph: string;
}

export const TRADING_CARDS: readonly TradingCard[] = [
  { id: "segfault", name: "Segfault", caption: "Core dumped, spirit intact.", colour: "#c02942", glyph: "💥" },
  { id: "coffee", name: "Cold Brew", caption: "Fuel for the 2 AM deploy.", colour: "#997c52", glyph: "☕" },
  { id: "container", name: "Container Ship", caption: "It works on every machine.", colour: "#4e8ddb", glyph: "🐳" },
  { id: "queue", name: "Message Queue", caption: "Delivered at least once.", colour: "#ff6600", glyph: "📨" },
  { id: "pi", name: "Raspberry Pi", caption: "Production runs on 8 GB.", colour: "#c252c9", glyph: "🍓" },
  { id: "gopher", name: "The Gopher", caption: "if err != nil { return err }", colour: "#00add8", glyph: "🐹" },
];

export const CARD_DROP_CHANCE = 0.25;

export const CARDS_CHANGED_EVENT = "spp:cards-changed";

export interface CardCollection {
  cards: string[];
  craftedAt?: string;
}

export const EMPTY_COLLECTION: CardCollection = { cards: [] };

export const isComplete = (collection: CardCollection): boolean =>
  TRADING_CARDS.every((card) => collection.cards.includes(card.id));
