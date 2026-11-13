"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok?: true; error?: string };

export async function addIncome(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const source_name = String(formData.get("source_name") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const recurrence = String(formData.get("recurrence") ?? "monthly");
  const next_date = (formData.get("next_date") as string) || null;
  const is_variable = String(formData.get("is_variable") ?? "") === "on";

  if (!source_name) return { error: "Please name the income source." };
  if (!amount || amount <= 0) return { error: "Please enter an amount greater than zero." };
  if (recurrence !== "irregular" && !next_date)
    return { error: "Please choose the next expected date (or mark it irregular)." };

  const { error } = await supabase.from("incomes").insert({
    user_id: user.id,
    source_name,
    amount,
    recurrence,
    next_date,
    is_variable,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteIncome(id: string): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
