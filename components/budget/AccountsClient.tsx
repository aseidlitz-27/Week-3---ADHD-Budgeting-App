"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { setAccountStatus } from "@/app/dashboard/actions";
import { formatMoney } from "@/lib/budget/format";

export type AccountRow = {
  id: string;
  name: string;
  type: string;
  institution_name: string | null;
  current_balance: number;
  connection_status: "active" | "expired" | "revoked";
};

export default function AccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(id: string, status: "active" | "revoked") {
    setError(null);
    startTransition(async () => {
      const res = await setAccountStatus(id, status);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info" icon={false}>
        🔒 We connect with a <b>read-only token</b> — never your bank password — and you can
        revoke it anytime. (This demo uses simulated data.)
      </Alert>
      {accounts.map((a) => {
        const active = a.connection_status === "active";
        return (
          <Paper
            key={a.id}
            elevation={0}
            sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider" }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {a.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {a.institution_name} · {a.type}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h3" component="p">
                  {formatMoney(Number(a.current_balance))}
                </Typography>
                <Chip
                  size="small"
                  label={active ? "Connected · read-only" : "Access revoked"}
                  color={active ? "success" : "default"}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              {active ? (
                <Button size="small" variant="outlined" color="error" disabled={pending} onClick={() => change(a.id, "revoked")}>
                  Revoke access
                </Button>
              ) : (
                <Button size="small" variant="outlined" disabled={pending} onClick={() => change(a.id, "active")}>
                  Reconnect
                </Button>
              )}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
