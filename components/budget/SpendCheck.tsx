"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { formatMoney } from "@/lib/budget/format";

/** In-the-moment check: "Can I spend £X right now?" */
export default function SpendCheck({ safe }: { safe: number }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; left: number; amount: number }>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!amount || amount <= 0) {
      setResult(null);
      return;
    }
    setResult({ ok: amount <= safe, left: safe - amount, amount });
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        About to buy something? Check if it&apos;s safe before you tap pay.
      </Typography>
      <Box component="form" onSubmit={check} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <TextField
          label="Amount"
          type="number"
          inputProps={{ step: "0.01", min: "0" }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="contained" size="large" sx={{ mt: 0.5 }}>
          Check
        </Button>
      </Box>
      {result && (
        <Alert severity={result.ok ? "success" : "warning"}>
          {result.ok ? (
            <>
              Yes — you can spend {formatMoney(result.amount)} and still have{" "}
              {formatMoney(result.left)} safe.
            </>
          ) : (
            <>
              That&apos;s {formatMoney(-result.left)} more than your safe amount. It would dip
              into bills or your buffer — maybe wait if you can.
            </>
          )}
        </Alert>
      )}
    </Stack>
  );
}
