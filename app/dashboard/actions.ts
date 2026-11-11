"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SEED_ACCOUNTS, generateSeedTransactions } from "@/lib/budget/sampleData";
import { categorizeMerchant } from "@/lib/budget/categorize";

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
    .insert(SEED_ACCOUNTS.map((a) => ({ ...a, user_id: user.id })))
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

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
