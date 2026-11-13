"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { deleteAllData } from "@/app/dashboard/settings/actions";

export default function PrivacyControls() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleErase() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAllData();
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Your data is encrypted at rest by Supabase and sent over HTTPS. Row-level
        security means only you can ever read your rows. Bank connections use a
        revocable read-only token — never your password.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="outlined" component="a" href="/dashboard/export">
          Export my data (JSON)
        </Button>
        <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
          Erase all my data
        </Button>
      </Box>

      <Dialog open={open} onClose={() => !pending && setOpen(false)}>
        <DialogTitle>Erase all your data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes your accounts, transactions, bills, income, and
            settings. Your login stays, but you&apos;ll start fresh from setup. This
            can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleErase} color="error" variant="contained" disabled={pending}>
            {pending ? "Erasing…" : "Erase everything"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
