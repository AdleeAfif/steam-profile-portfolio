export interface Rarity {
  tier: number;
  name: string;
  colour: string;
  proficiency: string;
}

export const RARITIES: readonly Rarity[] = [
  { tier: 1, name: "Consumer Grade", colour: "#b0c3d9", proficiency: "Familiar" },
  { tier: 2, name: "Industrial Grade", colour: "#5e98d9", proficiency: "Beginner" },
  { tier: 3, name: "Mil-Spec", colour: "#4b69ff", proficiency: "Intermediate" },
  { tier: 4, name: "Restricted", colour: "#8847ff", proficiency: "Proficient" },
  { tier: 5, name: "Classified", colour: "#d32ce6", proficiency: "Advanced" },
  { tier: 6, name: "Covert", colour: "#eb4b4b", proficiency: "Expert" },
];

export function rarity(tier: number): Rarity {
  const index = Math.min(RARITIES.length, Math.max(1, Math.round(Number.isFinite(tier) ? tier : 1))) - 1;
  return RARITIES[index];
}
