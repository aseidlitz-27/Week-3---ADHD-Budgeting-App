"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { addSubscriptionAsBill } from "@/app/dashboard/bills/actions";
import { formatMoney } from "@/lib/budget/format";
import type { DetectedSubscription } from "@/lib/budget/subscriptions";

export default function DetectedSubscriptions({ subs }: { subs: DetectedSubscription[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (subs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recurring subscriptions detected yet. As more transactions come in, we&apos;ll spot them.
      </Typography>
    );
  }

  function addAsBill(s: DetectedSubscription) {
    setError(null);
    startTransition(async () => {
      const res = await addSubscriptionAsBill(s.merchant, s.typicalAmount, s.cadence);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" color="text.secondary">
        These look like recurring charges. Add them as bills so we can remind you.
      </Typography>
      <Stack divider={<Divider />} spacing={0}>
        {subs.map((s) => (
          <Box
            key={s.merchant}
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.25, flexWrap: "wrap" }}
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {s.merchant}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMoney(s.typicalAmount)} · {s.cadence} · seen {s.count}×
              </Typography>
            </Box>
            <Button size="small" variant="outlined" disabled={pending} onClick={() => addAsBill(s)}>
              Add as bill
            </Button>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
