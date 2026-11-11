"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rollForward, addDaysISO, todayISO } from "@/lib/budget/recurrence";

type Result = { ok?: true; error?: string };

async function adjustBalance(
  supabase: ReturnType<typeof createClient>,
  accountId: string | null,
  delta: number,
) {
  if (!accountId) return;
  const { data: acc } = await supabase
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .single();
  if (acc) {
    await supabase
      .from("accounts")
      .update({ current_balance: Number(acc.current_balance) + delta })
      .eq("id", accountId);
  }
}

export async function addBill(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const due_date = String(formData.get("due_date") ?? "");
  const recurrence = String(formData.get("recurrence") ?? "monthly");
  const account_id = (formData.get("account_id") as string) || null;

  if (!name) return { error: "Please give the bill a name." };
  if (!amount || amount <= 0) return { error: "Please enter an amount greater than zero." };
  if (!due_date) return { error: "Please choose a due date." };

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({ user_id: user.id, name, amount, due_date, recurrence, status: "unpaid", account_id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Schedule a pre-due reminder using the user's lead-time setting.
  const { data: settings } = await supabase
    .from("settings")
    .select("reminder_lead_days")
    .eq("user_id", user.id)
    .single();
  const lead = settings?.reminder_lead_days ?? 3;
  const remind_at = `${addDaysISO(due_date, -lead)}T09:00:00Z`;
  await supabase
    .from("reminders")
    .insert({ user_id: user.id, bill_id: bill.id, remind_at, status: "scheduled" });

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function markBillPaid(billId: string): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: bill } = await supabase
    .from("bills")
    .select("id,name,amount,due_date,recurrence,account_id,status")
    .eq("id", billId)
    .single();
  if (!bill) return { error: "Bill not found." };

  // Record the payment as a transaction LINKED to the bill (counted once).
  const { data: cats } = await supabase.from("categories").select("id,name");
  const billsCat = (cats ?? []).find((c: { name: string }) => c.name === "Bills")?.id ?? null;
  const { error: txErr } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: bill.account_id,
    category_id: billsCat,
    bill_id: bill.id,
    amount: bill.amount,
    type: "expense",
    merchant: bill.name,
    occurred_on: todayISO(),
    source: "manual",
  });
  if (txErr) return { error: txErr.message };

  await adjustBalance(supabase, bill.account_id, -Math.abs(Number(bill.amount)));

  // Advance the bill: recurring rolls to the next cycle; one-off becomes paid.
  if (bill.recurrence && bill.recurrence !== "none") {
    await supabase
      .from("bills")
      .update({ due_date: rollForward(bill.due_date, bill.recurrence), status: "unpaid" })
      .eq("id", bill.id);
  } else {
    await supabase.from("bills").update({ status: "paid" }).eq("id", bill.id);
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteBill(billId: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("bills").delete().eq("id", billId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function addSubscriptionAsBill(
  merchant: string,
  amount: number,
  cadence: "weekly" | "monthly",
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const recurrence = cadence === "weekly" ? "weekly" : "monthly";
  const due_date = addDaysISO(todayISO(), cadence === "weekly" ? 7 : 30);
  const { error } = await supabase.from("bills").insert({
    user_id: user.id,
    name: merchant,
    amount,
    due_date,
    recurrence,
    status: "unpaid",
    is_subscription: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
