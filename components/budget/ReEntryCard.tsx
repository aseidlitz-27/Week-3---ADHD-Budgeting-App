"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { catchUp, type CatchUpResult } from "@/app/dashboard/actions";
import { formatMoney, formatDate } from "@/lib/budget/format";

type Summary = Extract<CatchUpResult, { ok: true }>;

/** Shame-free re-entry after a gap, with one-tap data catch-up and a
 *  before-and-after, where-it-went-by-category summary (ADR-0011). */
export default function ReEntryCard({ daysSince }: { daysSince: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      const res = await catchUp();
      if ("error" in res) setError(res.error);
      else setSummary(res); // keep it on screen until the user dismisses it
    });
  }

  function dismiss() {
    setSummary(null);
    setError(null);
    // Now sync the rest of the page (balance, safe-to-spend, the CTA itself).
    startTransition(() => router.refresh());
  }

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "secondary.main", bgcolor: "background.paper" }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h3" component="h2">
          Welcome back 👋
        </Typography>

        {summary ? (
          <CatchUpSummaryView summary={summary} onDismiss={dismiss} dismissing={pending} />
        ) : (
          <>
            <Typography variant="body1" color="text.secondary">
              It&apos;s been about {daysSince} days — no worries at all, and no streak to lose.
              Want me to pull in what happened while you were away?
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Box>
              <Button variant="contained" onClick={handle} disabled={pending}>
                {pending ? "Catching up…" : "Catch me up"}
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
}

function CatchUpSummaryView({
  summary,
  onDismiss,
  dismissing,
}: {
  summary: Summary;
  onDismiss: () => void;
  dismissing: boolean;
}) {
  // Empty state: nothing new to import.
  if (summary.imported === 0) {
    return (
      <Stack spacing={2}>
        <Alert severity="success">You&apos;re all caught up — nothing new to bring in.</Alert>
        <Box>
          <Button variant="outlined" onClick={onDismiss} disabled={dismissing}>
            Done
          </Button>
        </Box>
      </Stack>
    );
  }

  const { imported, beforeBalance, afterBalance, total, fromDate, toDate, byCategory, items } = summary;

  return (
    <Stack spacing={2}>
      <Typography variant="body1" color="text.secondary">
        Brought in {imported} transaction{imported > 1 ? "s" : ""} from{" "}
        {formatDate(fromDate)}
        {fromDate !== toDate ? ` – ${formatDate(toDate)}` : ""}. Here&apos;s what changed.
      </Typography>

      {/* Before -> after balance */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 1,
          p: 2,
          borderRadius: 2,
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Balance
        </Typography>
        <Typography variant="body1" sx={{ textDecoration: "line-through" }} color="text.secondary">
          {formatMoney(beforeBalance)}
        </Typography>
        <Typography variant="body1" aria-hidden>
          →
        </Typography>
        <Typography variant="h3" component="p">
          {formatMoney(afterBalance)}
        </Typography>
        <Typography variant="body2" color="error.main">
          (−{formatMoney(total)})
        </Typography>
      </Box>

      {/* Where it went, by category */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Where it went
        </Typography>
        <Stack
          component="ul"
          spacing={0}
          sx={{ listStyle: "none", m: 0, p: 0 }}
          aria-label="Spending by category"
        >
          {byCategory.map((c) => (
            <Box
              key={c.category}
              component="li"
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}
            >
              <Box>
                <Typography variant="body1" component="span">
                  {c.category}
                </Typography>
                <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                  {c.count} item{c.count > 1 ? "s" : ""}
                </Typography>
              </Box>
              <Typography variant="body1" component="span">
                {formatMoney(c.total)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Each imported transaction, with its date */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          What came in
        </Typography>
        <Stack
          component="ul"
          spacing={0}
          sx={{ listStyle: "none", m: 0, p: 0 }}
          aria-label="Imported transactions"
        >
          {items.map((it, idx) => (
            <Box
              key={`${it.date}-${it.merchant}-${idx}`}
              component="li"
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, py: 0.75 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" component="span">
                  {it.merchant}
                </Typography>
                <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                  {formatDate(it.date)} · {it.category}
                </Typography>
              </Box>
              <Typography variant="body1" component="span" sx={{ whiteSpace: "nowrap" }}>
                −{formatMoney(it.amount)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Button variant="outlined" onClick={onDismiss} disabled={dismissing}>
          {dismissing ? "Updating…" : "Got it"}
        </Button>
      </Box>
    </Stack>
  );
}
