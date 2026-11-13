"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { catchUp } from "@/app/dashboard/actions";

/** Shame-free re-entry after a gap, with one-tap data catch-up. */
export default function ReEntryCard({ daysSince }: { daysSince: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handle() {
    setResult(null);
    startTransition(async () => {
      const res = await catchUp();
      if (res.error) setResult(res.error);
      else {
        setResult(res.imported ? `Caught up — imported ${res.imported} transaction${res.imported > 1 ? "s" : ""}.` : "You're all caught up.");
        router.refresh();
      }
    });
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "secondary.main", bgcolor: "background.paper" }}>
      <Stack spacing={1.5}>
        <Typography variant="h3" component="h2">
          Welcome back 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          It&apos;s been about {daysSince} days — no worries at all, and no streak to lose.
          Want me to pull in what happened while you were away?
        </Typography>
        {result && <Alert severity="success">{result}</Alert>}
        <Box>
          <Button variant="contained" onClick={handle} disabled={pending}>
            {pending ? "Catching up…" : "Catch me up"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
