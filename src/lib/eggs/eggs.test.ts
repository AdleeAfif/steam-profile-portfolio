import { describe, expect, it } from "vitest";
import { TRADING_CARDS } from "../cards";
import { normaliseCollection, rollCardDrop } from "./cards";
import { KONAMI_SEQUENCE, isKonami, pushKey } from "./konami";

describe("rollCardDrop", () => {
  it("drops nothing when the roll misses", () => {
    expect(rollCardDrop({ cards: [] }, 0.25, 0)).toBeNull();
    expect(rollCardDrop({ cards: [] }, 0.9, 0)).toBeNull();
  });

  it("drops a card that is not yet collected", () => {
    const drop = rollCardDrop({ cards: [TRADING_CARDS[0].id] }, 0.1, 0);
    expect(drop?.card.id).toBe(TRADING_CARDS[1].id);
    expect(drop?.collection.cards).toEqual([TRADING_CARDS[0].id, TRADING_CARDS[1].id]);
    expect(drop?.complete).toBe(false);
  });

  it("clamps the pick to the missing cards", () => {
    const drop = rollCardDrop({ cards: [] }, 0, 1);
    expect(drop?.card.id).toBe(TRADING_CARDS[TRADING_CARDS.length - 1].id);
  });

  it("reports completion on the last card and keeps craftedAt", () => {
    const allButLast = TRADING_CARDS.slice(0, -1).map((c) => c.id);
    const drop = rollCardDrop({ cards: allButLast, craftedAt: "x" }, 0, 0.5);
    expect(drop?.complete).toBe(true);
    expect(drop?.collection.craftedAt).toBe("x");
  });

  it("drops nothing once everything is collected", () => {
    expect(rollCardDrop({ cards: TRADING_CARDS.map((c) => c.id) }, 0, 0)).toBeNull();
  });
});

describe("normaliseCollection", () => {
  it("drops unknown and duplicate ids and tolerates garbage", () => {
    expect(normaliseCollection(null)).toEqual({ cards: [] });
    expect(normaliseCollection({ cards: "nope" })).toEqual({ cards: [] });
    const id = TRADING_CARDS[2].id;
    expect(normaliseCollection({ cards: [id, id, "fake", 3] })).toEqual({ cards: [id] });
  });
});

describe("konami", () => {
  const type = (keys: readonly string[]) => keys.reduce<string[]>((buf, key) => pushKey(buf, key), []);

  it("matches the exact sequence, case-insensitive letters", () => {
    expect(isKonami(type(KONAMI_SEQUENCE))).toBe(true);
    expect(isKonami(type([...KONAMI_SEQUENCE.slice(0, 8), "B", "A"]))).toBe(true);
  });

  it("matches after a false start", () => {
    expect(isKonami(type(["ArrowUp", "ArrowUp", "ArrowUp", ...KONAMI_SEQUENCE]))).toBe(true);
  });

  it("rejects partial or wrong sequences", () => {
    expect(isKonami(type(KONAMI_SEQUENCE.slice(0, 9)))).toBe(false);
    expect(isKonami(type([...KONAMI_SEQUENCE.slice(0, 9), "x"]))).toBe(false);
  });
});
