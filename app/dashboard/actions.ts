"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SEED_ACCOUNTS, generateSeedTransactions } from "@/lib/budget/sampleData";
import { categorizeMerchant } from "@/lib/budget/categorize";
import { todayISO, addDaysISO, daysBetween } from "@/lib/budget/recurrence";
import { summarizeByCategory, type CatchUpItem, type CategoryTotal } from "@/lib/budget/catchUpSummary";

type Result = { ok?: true; error?: string };

/** Simulated aggregator: seed fake accounts + ~2 months of transactions. */
export async function connectSimulatedBank(): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: existing } = await supabase.from("accounts").select("id").limit(1);
  if (existing && existing.length) return { error: "A bank is already connected." };

  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .insert(
      SEED_ACCOUNTS.map((a) => ({
        ...a,
        user_id: user.id,
        // A revocable, read-only token stands in for the bank connection.
        // We never store bank credentials (fake data only).
        external_ref: `tok_sim_${crypto.randomUUID().slice(0, 12)}`,
      })),
    )
    .select("id,name");
  if (accErr || !accounts) return { error: accErr?.message ?? "Could not create accounts." };

  const accByName = new Map<string, string>(accounts.map((a: { id: string; name: string }) => [a.name, a.id]));

  const { data: cats } = await supabase.from("categories").select("id,name");
  const catByName = new Map<string, string>((cats ?? []).map((c: { id: string; name: string }) => [c.name, c.id]));
  const otherId = catByName.get("Other") ?? null;

  const today = new Date();
  const rows = generateSeedTransactions().map((t) => {
    const d = new Date(today);
    d.setDate(d.getDate() - t.daysAgo);
    const catName = t.type === "income" ? null : categorizeMerchant(t.merchant);
    const category_id = catName ? catByName.get(catName) ?? otherId : null;
    return {
      user_id: user.id,
      account_id: accByName.get(SEED_ACCOUNTS[t.accountIndex].name),
      category_id,
      amount: t.amount,
      type: t.type,
      merchant: t.merchant,
      occurred_on: d.toISOString().slice(0, 10),
      source: "import",
    };
  });

  const { error: txErr } = await supabase.from("transactions").insert(rows);
  if (txErr) return { error: txErr.message };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setAccountStatus(
  accountId: string,
  status: "active" | "revoked",
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ connection_status: status })
    .eq("id", accountId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Change a transaction's category AND remember it for this merchant (learning). */
export async function recategorizeTransaction(
  txnId: string,
  categoryId: string,
  merchant: string | null,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", txnId);
  if (error) return { error: error.message };

  if (merchant) {
    const { data: rule } = await supabase
      .from("category_rules")
      .select("id")
      .eq("match_text", merchant)
      .limit(1);
    if (rule && rule.length) {
      await supabase.from("category_rules").update({ category_id: categoryId }).eq("id", rule[0].id);
    } else {
      await supabase
        .from("category_rules")
        .insert({ user_id: user.id, match_text: merchant, category_id: categoryId });
    }
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function addManualTransaction(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const amount = Number(formData.get("amount"));
  const merchant = String(formData.get("merchant") ?? "").trim();
  const type = (String(formData.get("type") ?? "expense") === "income" ? "income" : "expense") as
    | "expense"
    | "income";
  const account_id = String(formData.get("account_id") ?? "");
  const occurred_on = String(formData.get("occurred_on") ?? "") || new Date().toISOString().slice(0, 10);
  let category_id: string | null = (formData.get("category_id") as string) || null;

  if (!amount || amount <= 0) return { error: "Please enter an amount greater than zero." };
  if (!account_id) return { error: "Please choose an account." };

  if (!category_id && type === "expense" && merchant) {
    const { data: cats } = await supabase.from("categories").select("id,name");
    const name = categorizeMerchant(merchant);
    category_id = (cats ?? []).find((c: { name: string }) => c.name === name)?.id ?? null;
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id,
    category_id,
    amount,
    type,
    merchant: merchant || null,
    occurred_on,
    source: "manual",
  });
  if (error) return { error: error.message };

  // Keep the account balance in step with new activity.
  const delta = type === "income" ? amount : -amount;
  const { data: acc } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", account_id)
    .single();
  if (acc) {
    await supabase
      .from("accounts")
      .update({ current_balance: Number(acc.current_balance) + delta })
      .eq("id", account_id);
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Record a small-win milestone once (idempotent). No-op if already earned. */
export async function recordReward(kind: string): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: existing } = await supabase.from("rewards").select("id").eq("kind", kind).limit(1);
  if (existing && existing.length) return { ok: true };

  await supabase.from("rewards").insert({ user_id: user.id, kind, acknowledged: true });
  return { ok: true };
}

const CATCHUP_MERCHANTS: { merchant: string; amount: number }[] = [
  { merchant: "Tesco Express", amount: 18.4 },
  { merchant: "Starbucks", amount: 4.95 },
  { merchant: "TfL Travel", amount: 6.6 },
  { merchant: "Amazon", amount: 23.75 },
  { merchant: "Local Cafe", amount: 9.2 },
];

/**
 * Shame-free re-entry: import the transactions that happened while the user was
 * away, from their last recorded activity up to today. Fake data only.
 */
export type CatchUpLineItem = { date: string; merchant: string; amount: number; category: string };

export type CatchUpResult =
  | { error: string }
  | {
      ok: true;
      imported: number;
      beforeBalance: number;
      afterBalance: number;
      total: number;
      fromDate: string;
      toDate: string;
      byCategory: CategoryTotal[];
      items: CatchUpLineItem[];
    };

export async function catchUp(): Promise<CatchUpResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: accts } = await supabase
    .from("accounts")
    .select("id")
    .eq("connection_status", "active")
    .limit(1);
  if (!accts || accts.length === 0) return { error: "Connect a bank first." };
  const account_id = accts[0].id;

  // Balance the user currently sees (sum across all their accounts), captured
  // BEFORE the import so we can show a before -> after.
  const { data: allAccts } = await supabase.from("accounts").select("current_balance");
  const beforeBalance = (allAccts ?? []).reduce(
    (s, a: { current_balance: number }) => s + Number(a.current_balance),
    0,
  );

  const { data: latest } = await supabase
    .from("transactions")
    .select("occurred_on")
    .order("occurred_on", { ascending: false })
    .limit(1);
  const today = todayISO();
  const lastDate = latest?.[0]?.occurred_on ?? addDaysISO(today, -7);
  const gap = Math.max(1, Math.min(daysBetween(lastDate, today), 10));
  const count = Math.min(gap, CATCHUP_MERCHANTS.length);
  if (count <= 0) {
    return {
      ok: true,
      imported: 0,
      beforeBalance,
      afterBalance: beforeBalance,
      total: 0,
      fromDate: today,
      toDate: today,
      byCategory: [],
      items: [],
    };
  }

  const { data: cats } = await supabase.from("categories").select("id,name");
  const catByName = new Map<string, string>((cats ?? []).map((c: { id: string; name: string }) => [c.name, c.id]));

  // One source of truth for each item's display category and its stored id.
  const items: CatchUpItem[] = CATCHUP_MERCHANTS.slice(0, count).map((m) => ({
    merchant: m.merchant,
    amount: m.amount,
    category: categorizeMerchant(m.merchant),
  }));

  const rows = items.map((m, i) => ({
    user_id: user.id,
    account_id,
    category_id: catByName.get(m.category) ?? catByName.get("Other") ?? null,
    amount: m.amount,
    type: "expense" as const,
    merchant: m.merchant,
    occurred_on: addDaysISO(today, -(i + 1)),
    source: "import" as const,
  }));

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return { error: error.message };

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const { data: acc } = await supabase.from("accounts").select("current_balance").eq("id", account_id).single();
  if (acc) {
    await supabase
      .from("accounts")
      .update({ current_balance: Number(acc.current_balance) - total })
      .eq("id", account_id);
  }

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    imported: rows.length,
    beforeBalance,
    afterBalance: beforeBalance - total,
    total,
    fromDate: addDaysISO(today, -count),
    toDate: addDaysISO(today, -1),
    byCategory: summarizeByCategory(items),
    items: rows.map((r, i) => ({
      date: r.occurred_on,
      merchant: r.merchant,
      amount: r.amount,
      category: items[i].category,
    })),
  };
}
