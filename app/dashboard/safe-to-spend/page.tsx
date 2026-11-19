import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { computeSafeToSpend } from "@/lib/budget/safeToSpend";
import type { ForecastBill, ForecastIncome } from "@/lib/budget/forecast";
import { todayISO, daysBetween } from "@/lib/budget/recurrence";
import SafeToSpendNumber from "@/components/budget/SafeToSpendNumber";
import SpendCheck from "@/components/budget/SpendCheck";
import PaydayBuffer from "@/components/budget/PaydayBuffer";
import IncomeManager, { type IncomeRow } from "@/components/budget/IncomeManager";
import ConnectBankButton from "@/components/budget/ConnectBankButton";
import ReEntryCard from "@/components/budget/ReEntryCard";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
      <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default async function SafeToSpendPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: accounts },
    { data: bills },
    { data: incomes },
    { data: settings },
    { data: todayTx },
    { data: latestTx },
  ] = await Promise.all([
    supabase.from("accounts").select("current_balance"),
    supabase.from("bills").select("name,amount,due_date,recurrence,status"),
    supabase.from("incomes").select("id,source_name,amount,recurrence,next_date,is_variable"),
    supabase.from("settings").select("safe_to_spend_buffer").eq("user_id", user!.id).single(),
    supabase.from("transactions").select("amount,type").eq("occurred_on", todayISO()),
    supabase.from("transactions").select("occurred_on").order("occurred_on", { ascending: false }).limit(1),
  ]);

  if (!accounts || accounts.length === 0) {
    return (
      <Stack spacing={3}>
        <Typography variant="h1" component="h1">
          Safe to spend
        </Typography>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Connect a bank so we can work out what&apos;s safe to spend today.
            </Typography>
            <ConnectBankButton />
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const balance = accounts.reduce((s, a: { current_balance: number }) => s + Number(a.current_balance), 0);
  const buffer = Number(settings?.safe_to_spend_buffer ?? 0);
  const sts = computeSafeToSpend(
    balance,
    (bills ?? []) as ForecastBill[],
    (incomes ?? []) as ForecastIncome[],
    buffer,
  );
  const spentToday = (todayTx ?? [])
    .filter((t: { type: string }) => t.type === "expense")
    .reduce((s, t: { amount: number }) => s + Number(t.amount), 0);

  const lastTxDate = (latestTx as { occurred_on: string }[] | null)?.[0]?.occurred_on;
  const daysSince = lastTxDate ? daysBetween(lastTxDate, todayISO()) : 0;

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Safe to spend
      </Typography>

      {daysSince >= 2 && <ReEntryCard daysSince={daysSince} />}

      <SafeToSpendNumber sts={sts} />

      <Card title="Can I afford this?">
        <SpendCheck safe={sts.safe} />
      </Card>

      <Card title="Pace yourself to payday">
        <PaydayBuffer sts={sts} spentToday={spentToday} />
      </Card>

      <Card title="Your income">
        <IncomeManager incomes={(incomes ?? []) as IncomeRow[]} />
      </Card>
    </Stack>
  );
}
