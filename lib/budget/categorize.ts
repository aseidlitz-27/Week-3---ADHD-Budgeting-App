/**
 * Simple, explainable auto-categorization: match a merchant name against
 * keywords for each default category. Returns a category NAME (one of the
 * 8 seeded defaults) or "Other" when nothing matches.
 *
 * Learned per-user rules (the `category_rules` table) take priority over this
 * and are applied by the caller before falling back to these keywords.
 */
const KEYWORDS: Record<string, string[]> = {
  Groceries: ["lidl", "aldi", "tesco", "sainsbury", "whole foods", "grocery", "market", "co-op", "trader joe"],
  Dining: ["starbucks", "mcdonald", "cafe", "coffee", "restaurant", "pizza", "deliveroo", "uber eats", "kitchen", "diner", "pub"],
  Transport: ["uber", "lyft", "tfl", "transit", "shell", "bp ", "petrol", "gas station", "train", "rail", "parking", "bus"],
  Bills: ["rent", "electric", "water", "gas bill", "phone", "mobile", "internet", "broadband", "insurance", "council tax"],
  Shopping: ["amazon", "h&m", "zara", "ikea", "target", "walmart", "store", "apple", "clothing", "shop"],
  Health: ["pharmacy", "boots", "gym", "fitness", "clinic", "dental", "doctor", "health", "cvs", "walgreens"],
  Entertainment: ["netflix", "spotify", "cinema", "disney", "steam", "playstation", "concert", "hulu", "youtube"],
};

export function categorizeMerchant(merchant: string): string {
  const m = merchant.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => m.includes(w))) return category;
  }
  return "Other";
}
