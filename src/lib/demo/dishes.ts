import type { MenuCategory } from "../types";

/** URL-safe slug for hotel names and generated ids. */
export function slugify(s: string): string {
  const out = s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "hotel";
}

export interface DishPreset { key: string; name: string; nameSw: string; category: MenuCategory; kes: number; emoji: string; hue: number; popular: boolean }

/** Onboarding checklist (§8.10): 20 common Kenyan hotel dishes with typical Nairobi street prices. */
export const DISHES: DishPreset[] = [
  { key: "chai", name: "Chai", nameSw: "Chai ya Maziwa", category: "breakfast", kes: 30, emoji: "☕", hue: 32, popular: true },
  { key: "mandazi", name: "Mandazi", nameSw: "Mandazi", category: "breakfast", kes: 10, emoji: "🥯", hue: 38, popular: true },
  { key: "chapati", name: "Chapati", nameSw: "Chapati", category: "side", kes: 20, emoji: "🫓", hue: 40, popular: true },
  { key: "uji", name: "Porridge", nameSw: "Uji wa Wimbi", category: "breakfast", kes: 40, emoji: "🥣", hue: 30, popular: false },
  { key: "mayai", name: "Boiled Eggs", nameSw: "Mayai ya Kuchemsha", category: "breakfast", kes: 25, emoji: "🥚", hue: 48, popular: false },
  { key: "madondo", name: "Beans Stew", nameSw: "Maharagwe (Madondo)", category: "main", kes: 80, emoji: "🫘", hue: 20, popular: true },
  { key: "chapati-madondo", name: "Chapati Madondo", nameSw: "Chapati na Madondo", category: "main", kes: 110, emoji: "🫘", hue: 24, popular: true },
  { key: "ugali-sukuma", name: "Ugali Sukuma", nameSw: "Ugali na Sukuma Wiki", category: "main", kes: 70, emoji: "🥬", hue: 120, popular: true },
  { key: "ugali-beef", name: "Ugali Beef", nameSw: "Ugali na Nyama", category: "main", kes: 180, emoji: "🍖", hue: 12, popular: true },
  { key: "ugali-samaki", name: "Ugali Samaki", nameSw: "Ugali na Samaki", category: "main", kes: 250, emoji: "🐟", hue: 200, popular: false },
  { key: "pilau", name: "Pilau", nameSw: "Pilau ya Nyama", category: "main", kes: 150, emoji: "🍛", hue: 28, popular: true },
  { key: "wali-maharagwe", name: "Rice & Beans", nameSw: "Wali na Maharagwe", category: "main", kes: 100, emoji: "🍚", hue: 45, popular: false },
  { key: "githeri", name: "Githeri", nameSw: "Githeri Special", category: "main", kes: 80, emoji: "🌽", hue: 50, popular: false },
  { key: "matumbo", name: "Matumbo", nameSw: "Matumbo Fry", category: "main", kes: 150, emoji: "🍲", hue: 8, popular: false },
  { key: "ndengu", name: "Green Grams", nameSw: "Ndengu na Chapati", category: "main", kes: 100, emoji: "🥣", hue: 90, popular: false },
  { key: "mukimo", name: "Mukimo", nameSw: "Mukimo na Nyama", category: "main", kes: 150, emoji: "🥔", hue: 100, popular: false },
  { key: "chips", name: "Chips", nameSw: "Chipo", category: "snack", kes: 100, emoji: "🍟", hue: 46, popular: false },
  { key: "samosa", name: "Samosa", nameSw: "Sambusa", category: "snack", kes: 30, emoji: "🥟", hue: 36, popular: false },
  { key: "soda", name: "Soda", nameSw: "Soda (300ml)", category: "drink", kes: 60, emoji: "🥤", hue: 0, popular: false },
  { key: "maji", name: "Water", nameSw: "Maji (500ml)", category: "drink", kes: 50, emoji: "💧", hue: 210, popular: false },
];