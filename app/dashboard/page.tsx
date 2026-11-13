import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/budget/format";
import { todayISO, addDaysISO } from "@/lib/budget/recurrence";
import { computeSafeToSpend } from "@/lib/budget/safeToSpend";
import type { ForecastBill, ForecastIncome } from "@/lib/budget/forecast";
import WhereItWent, { type CategorySlice } from "@/components/budget/WhereItWent";
import SafeToSpendNumber from "@/components/budget/SafeToSpendNumber";
import ConnectBankButton from "@/components/budget/ConnectBankButton";

type Txn = {
  id: string;
  amount: number;
  type: "expense" | "income";
  merchant: string | null;
  occurred_on: string;
  category: { name: string; color: string | null } | null;
};

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
      {title && (
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

export default async function OverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();
  const name = profile?.display_name || user!.email?.split("@")[0] || "there";

  const { data: accounts } = await supabase.from("accounts").select("id,current_balance");
  const { data: txns } = await supabase
    .from("transactions")
    .select("id,amount,type,merchant,occurred_on,category:categories(name,color)")
    .order("occurred_on", { ascending: false });

  const transactions = (txns ?? []) as unknown as Txn[];

  const { data: billRows } = await supabase
    .from("bills")
    .select("name,amount,due_date,recurrence,status");
  const { data: incomeRows } = await supabase.from("incomes").select("amount,next_date,recurrence");
  const { data: settingsRow } = await supabase
    .from("settings")
    .select("safe_to_spend_buffer")
    .eq("user_id", user!.id)
    .single();

  const dueToday = todayISO();
  const dueSoonLimit = addDaysISO(dueToday, 7);
  const unpaidUpcoming = (billRows ?? []).filter(
    (b: { due_date: string; status: string }) => b.status === "unpaid" && b.due_date <= dueSoonLimit,
  );
  const overdueCount = unpaidUpcoming.filter((b: { due_date: string }) => b.due_date < dueToday).length;
  const dueSoonCount = unpaidUpcoming.length - overdueCount;

  if (!accounts || accounts.length === 0) {
    return (
      <Stack spacing={3}>
        <Typography variant="h1" component="h1">
          Hi {name} 👋
        </Typography>
        <Card>
          <Stack spacing={2}>
            <Typography variant="body1">
              Let&apos;s bring your spending in. Connect a bank and we&apos;ll pull
              in your recent transactions automatically — no logging required.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This demo uses safe, simulated data (no real bank is contacted).
            </Typography>
            <Box>
              <ConnectBankButton />
            </Box>
          </Stack>
        </Card>
      </Stack>
    );
  }

  const totalBalance = accounts.reduce((s, a: { current_balance: number }) => s + Number(a.current_balance), 0);

  const sts = computeSafeToSpend(
    totalBalance,
    (billRows ?? []) as ForecastBill[],
    (incomeRows ?? []) as ForecastIncome[],
    Number(settingsRow?.safe_to_spend_buffer ?? 0),
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = transactions.filter((t) => t.occurred_on >= cutoffStr);

  const spent30 = recent.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const income30 = recent.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

  const byCat = new Map<string, CategorySlice>();
  for (const t of recent) {
    if (t.type !== "expense") continue;
    const key = t.category?.name ?? "Uncategorized";
    const prev = byCat.get(key) ?? { name: key, color: t.category?.color ?? null, total: 0 };
    prev.total += Number(t.amount);
    byCat.set(key, prev);
  }
  const slices = Array.from(byCat.values()).sort((a, b) => b.total - a.total);

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Hi {name} 👋
      </Typography>

      <SafeToSpendNumber sts={sts} compact />

      {overdueCount + dueSoonCount > 0 && (
        <Alert severity={overdueCount > 0 ? "warning" : "info"}>
          {overdueCount > 0
            ? `${overdueCount} bill${overdueCount > 1 ? "s are" : " is"} overdue. `
            : `${dueSoonCount} bill${dueSoonCount > 1 ? "s are" : " is"} due in the next 7 days. `}
          <Link component={NextLink} href="/dashboard/bills">
            Review bills
          </Link>
        </Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {[
          { label: "Total balance", value: formatMoney(totalBalance) },
          { label: "Spent (30 days)", value: formatMoney(spent30) },
          { label: "Income (30 days)", value: formatMoney(income30) },
        ].map((s) => (
          <Paper
            key={s.label}
            elevation={0}
            sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", flex: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              {s.label}
            </Typography>
            <Typography variant="h2" component="p" sx={{ mt: 0.5 }}>
              {s.value}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Card title="Where it went (last 30 days)">
        <WhereItWent slices={slices} />
      </Card>

      <Card title="Recent activity">
        <Stack divider={<Divider />} spacing={0}>
          {transactions.slice(0, 6).map((t) => (
            <Box key={t.id} sx={{ display: "flex", justifyContent: "space-between", py: 1.25 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t.merchant ?? "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(t.occurred_on)}
                  {t.category ? ` · ${t.category.name}` : ""}
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: t.type === "income" ? "success.main" : "text.primary" }}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(Number(t.amount))}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
