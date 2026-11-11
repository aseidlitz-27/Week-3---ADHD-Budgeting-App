/**
 * The "simulated aggregator": a realistic set of fake accounts and
 * transactions we seed when a user connects a bank. FAKE DATA ONLY — no real
 * bank is contacted (see docs/adr/0004).
 */

export type SeedAccount = {
  name: string;
  type: "checking" | "savings" | "credit" | "cash";
  institution_name: string;
  current_balance: number;
};

export type SeedTxn = {
  accountIndex: number; // index into the accounts array
  merchant: string;
  amount: number; // always positive
  type: "expense" | "income";
  daysAgo: number;
};

export const SEED_ACCOUNTS: SeedAccount[] = [
  { name: "Everyday Checking", type: "checking", institution_name: "Simulated Bank", current_balance: 1842.37 },
  { name: "Rainy Day Savings", type: "savings", institution_name: "Simulated Bank", current_balance: 3250.0 },
];

/** Build ~2 months of believable transactions. Deterministic, no randomness. */
export function generateSeedTransactions(): SeedTxn[] {
  const txns: SeedTxn[] = [];
  const add = (daysAgo: number, merchant: string, amount: number, type: "expense" | "income" = "expense", accountIndex = 0) =>
    txns.push({ accountIndex, merchant, amount, type, daysAgo });

  // Income — two monthly paydays + one variable freelance gig
  add(58, "Acme Co Salary", 2100.0, "income");
  add(28, "Acme Co Salary", 2100.0, "income");
  add(16, "Freelance — Figma gig", 480.0, "income");

  // Rent + utilities (show up under Bills)
  add(55, "Rent — Flat 4B", 950.0);
  add(25, "Rent — Flat 4B", 950.0);
  add(50, "Electric — PowerCo", 64.2);
  add(20, "Phone — Mobile Plan", 22.0);

  // Weekly-ish groceries
  const groceryShops = ["Lidl", "Tesco Express", "Aldi", "Sainsbury's"];
  for (let i = 0; i < 8; i++) {
    add(56 - i * 7, groceryShops[i % groceryShops.length], 34.5 + (i % 3) * 7.25);
  }

  // Coffee + dining, a few times a week
  const diners = ["Starbucks", "Local Cafe", "McDonald's", "Deliveroo", "Corner Pizza"];
  for (let i = 0; i < 16; i++) {
    add(57 - i * 3.5, diners[i % diners.length], 4.75 + (i % 4) * 3.1);
  }

  // Transport
  const transport = ["Uber", "TfL Travel", "Shell Petrol", "TfL Travel"];
  for (let i = 0; i < 10; i++) {
    add(55 - i * 5.5, transport[i % transport.length], 3.2 + (i % 3) * 6.4);
  }

  // Shopping
  add(44, "Amazon", 38.99);
  add(31, "H&M", 59.0);
  add(12, "Amazon", 21.5);
  add(5, "IKEA", 74.25);

  // Subscriptions (Entertainment)
  add(49, "Netflix", 10.99);
  add(19, "Netflix", 10.99);
  add(47, "Spotify", 9.99);
  add(17, "Spotify", 9.99);

  // Health
  add(40, "Boots Pharmacy", 12.4);
  add(33, "FitLife Gym", 29.99);
  add(3, "FitLife Gym", 29.99);

  return txns.map((t) => ({ ...t, daysAgo: Math.round(t.daysAgo) }));
}
