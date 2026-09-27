import type { Catalog } from "../ai/intents";

/** Demo catalog used by tests and by the offline agent before the DB loads. */
export const DEMO_CATALOG: Catalog = {
  menu: [
    { id: "m-ugali-beef", name: "Ugali Beef", aliases: ["ugali nyama", "ugali beef stew"] },
    { id: "m-ugali-samaki", name: "Ugali Samaki", aliases: ["ugali fish", "ugali na samaki"] },
    { id: "m-ugali-sukuma", name: "Ugali Sukuma", aliases: ["ugali mboga", "ugali sukuma wiki"] },
    { id: "m-chapati", name: "Chapati", aliases: ["chapo", "chapos", "chapati"] },
    { id: "m-madondo", name: "Madondo", aliases: ["maharagwe", "beans"] },
    { id: "m-chapati-madondo", name: "Chapati Madondo", aliases: ["chapo madondo", "chapo beans"] },
    { id: "m-pilau", name: "Pilau", aliases: ["pilau beef"] },
    { id: "m-wali", name: "Wali Maharagwe", aliases: ["wali", "rice", "rice beans"] },
    { id: "m-githeri", name: "Githeri", aliases: ["githeri special"] },
    { id: "m-matumbo", name: "Matumbo", aliases: ["matumbo fry", "tripe"] },
    { id: "m-samaki", name: "Samaki Wet Fry", aliases: ["samaki", "fish", "wet fry"] },
    { id: "m-ndengu", name: "Ndengu", aliases: ["green grams", "ndengu na chapati"] },
    { id: "m-mandazi", name: "Mandazi", aliases: ["maandazi", "mandazi"] },
    { id: "m-chai", name: "Chai", aliases: ["chai", "tea", "chai maziwa"] },
  ],
  inventory: [
    { id: "i-mafuta", name: "Mafuta ya Kupika", aliases: ["mafuta", "oil", "cooking oil"] },
    { id: "i-unga", name: "Unga wa Ugali", aliases: ["unga", "flour", "unga ugali"] },
    { id: "i-ngano", name: "Unga wa Ngano", aliases: ["ngano", "wheat flour"] },
    { id: "i-mchele", name: "Mchele", aliases: ["mchele", "rice"] },
    { id: "i-gas", name: "Gas (13kg)", aliases: ["gas", "gesi", "mtungi"] },
    { id: "i-makaa", name: "Makaa", aliases: ["makaa", "charcoal"] },
    { id: "i-maharagwe", name: "Maharagwe", aliases: ["maharagwe", "beans"] },
    { id: "i-sukari", name: "Sukari", aliases: ["sukari", "sugar"] },
    { id: "i-majani", name: "Majani ya Chai", aliases: ["majani", "tea leaves"] },
    { id: "i-maziwa", name: "Maziwa", aliases: ["maziwa", "milk"] },
  ],
  customers: [
    { id: "c-otieno", name: "Otieno", aliases: ["otis", "baba otieno", "otieno ochieng"] },
    { id: "c-wanjiku", name: "Wanjiku", aliases: ["shiku", "mama wanjiku"] },
    { id: "c-kamau", name: "Kamau", aliases: ["kamau fundi"] },
    { id: "c-achieng", name: "Achieng", aliases: ["achi"] },
    { id: "c-mwangi", name: "Mwangi", aliases: ["mwas"] },
  ],
};
