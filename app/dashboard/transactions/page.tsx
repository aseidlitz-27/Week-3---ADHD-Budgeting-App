import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import TransactionsClient from "@/components/budget/TransactionsClient";
import ConnectBankButton from "@/components/budget/ConnectBankButton";

export default async function TransactionsPage() {
  const supabase = createClient();

  const [{ data: txns }, { data: cats }, { data: accounts }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,amount,type,merchant,occurred_on,category_id")
      .order("occurred_on", { ascending: false }),
    supabase.from("categories").select("id,name").order("name", { ascending: true }),
    supabase.from("accounts").select("id,name").order("created_at", { ascending: true }),
  ]);

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Transactions
      </Typography>

      {!accounts || accounts.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              Connect a bank to import transactions, or add one by hand once you
              have an account.
            </Typography>
            <ConnectBankButton />
          </Stack>
        </Paper>
      ) : (
        <TransactionsClient
          transactions={(txns ?? []) as never}
          categories={(cats ?? []) as never}
          accounts={accounts as never}
        />
      )}
    </Stack>
  );
}
