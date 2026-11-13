import { createClient } from "@/lib/supabase/server";

/** Download everything we hold for the signed-in user as a JSON file. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [profile, settings, accounts, transactions, bills, incomes, categories, categoryRules, reminders, rewards] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("settings").select("*").eq("user_id", user.id).single(),
      supabase.from("accounts").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("bills").select("*"),
      supabase.from("incomes").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("category_rules").select("*"),
      supabase.from("reminders").select("*"),
      supabase.from("rewards").select("*"),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    settings: settings.data,
    accounts: accounts.data ?? [],
    transactions: transactions.data ?? [],
    bills: bills.data ?? [],
    incomes: incomes.data ?? [],
    categories: categories.data ?? [],
    category_rules: categoryRules.data ?? [],
    reminders: reminders.data ?? [],
    rewards: rewards.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="adhd-budget-export.json"',
    },
  });
}
