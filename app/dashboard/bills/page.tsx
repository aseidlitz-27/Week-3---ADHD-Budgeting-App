import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import BillsClient, { type BillRow } from "@/components/budget/BillsClient";
import ForecastView from "@/components/budget/ForecastView";
import DetectedSubscriptions from "@/components/budget/DetectedSubscriptions";
import ConnectBankButton from "@/components/budget/ConnectBankButton";
import { buildForecast, type ForecastBill, type ForecastIncome } from "@/lib/budget/forecast";
import { detectSubscriptions, type DetectTxn } from "@/lib/budget/subscriptions";

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

export default async function BillsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: bills }, { data: incomes }, { data: txns }, { data: settings }] =
    await Promise.all([
      supabase.from("accounts").select("id,name,current_balance").order("created_at", { ascending: true }),
      supabase.from("bills").select("id,name,amount,due_date,recurrence,status,is_subscription,account_id"),
      supabase.from("incomes").select("source_name,amount,next_date,recurrence"),
      supabase.from("transactions").select("merchant,amount,occurred_on,type"),
      supabase.from("settings").select("safe_to_spend_buffer").eq("user_id", user!.id).single(),
    ]);

  if (!accounts || accounts.length === 0) {
    return (
      <Stack spacing={3}>
        <Typography variant="h1" component="h1">
          Bills &amp; forecast
        </Typography>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Connect a bank first so we can forecast your balance and spot recurring charges.
            </Typography>
            <ConnectBankButton />
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const startBalance = accounts.reduce((s, a: { current_balance: number }) => s + Number(a.current_balance), 0);
  const buffer = Number(settings?.safe_to_spend_buffer ?? 0);

  const forecast = buildForecast(
    startBalance,
    (bills ?? []) as ForecastBill[],
    (incomes ?? []) as ForecastIncome[],
    { horizonDays: 45, buffer },
  );

  const subs = detectSubscriptions((txns ?? []) as DetectTxn[]);

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Bills &amp; forecast
      </Typography>

      <BillsClient
        bills={(bills ?? []) as BillRow[]}
        accounts={accounts.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))}
      />

      <Card title="Balance forecast (next 45 days)">
        <ForecastView forecast={forecast} />
      </Card>

      <Card title="Detected subscriptions">
        <DetectedSubscriptions subs={subs} />
      </Card>
    </Stack>
  );
}
