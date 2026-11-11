import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import AccountsClient, { type AccountRow } from "@/components/budget/AccountsClient";
import ConnectBankButton from "@/components/budget/ConnectBankButton";

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type,institution_name,current_balance,connection_status")
    .order("created_at", { ascending: true });

  const rows = (accounts ?? []) as AccountRow[];

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Accounts
      </Typography>

      {rows.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              No accounts connected yet. Connect a bank to import your spending —
              it uses safe, simulated data for this demo.
            </Typography>
            <ConnectBankButton />
          </Stack>
        </Paper>
      ) : (
        <AccountsClient accounts={rows} />
      )}
    </Stack>
  );
}
