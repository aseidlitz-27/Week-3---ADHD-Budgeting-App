"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { addIncome, deleteIncome } from "@/app/dashboard/safe-to-spend/actions";
import { formatDate, formatMoney } from "@/lib/budget/format";
import { addDaysISO, todayISO } from "@/lib/budget/recurrence";

export type IncomeRow = {
  id: string;
  source_name: string;
  amount: number;
  recurrence: string;
  next_date: string | null;
  is_variable: boolean;
};

export default function IncomeManager({ incomes }: { incomes: IncomeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [recurrence, setRecurrence] = useState("monthly");
  const [nextDate, setNextDate] = useState(addDaysISO(todayISO(), 7));
  const [variable, setVariable] = useState(false);

  function run(fn: () => Promise<{ ok?: true; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else {
        after?.();
        router.refresh();
      }
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("source_name", source);
    fd.set("amount", amount);
    fd.set("recurrence", recurrence);
    fd.set("next_date", recurrence === "irregular" ? "" : nextDate);
    fd.set("is_variable", variable ? "on" : "");
    run(
      () => addIncome(fd),
      () => {
        setSource("");
        setAmount("");
        setVariable(false);
      },
    );
  }

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" color="text.secondary">
        Add every source you earn from — a job, gig work, benefits. Variable sources use your
        typical amount as an estimate. This powers your safe-to-spend and forecast.
      </Typography>

      <Box component="form" onSubmit={handleAdd}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Source" required value={source} onChange={(e) => setSource(e.target.value)} sx={{ flex: 2 }} />
            <TextField
              label="Amount"
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="inc-rec">Frequency</InputLabel>
              <Select labelId="inc-rec" label="Frequency" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <MenuItem value="one_time">One-time</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Every 2 weeks</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="irregular">Irregular</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Next expected"
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={recurrence === "irregular"}
              sx={{ flex: 1 }}
            />
          </Stack>
          <FormControlLabel
            control={<Switch checked={variable} onChange={(e) => setVariable(e.target.checked)} />}
            label="Amount varies (estimate)"
          />
          <Box>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Saving…" : "Add income"}
            </Button>
          </Box>
        </Stack>
      </Box>

      {incomes.length > 0 && (
        <Stack divider={<Divider />} spacing={0}>
          {incomes.map((inc) => (
            <Box key={inc.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.25, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {inc.source_name} {inc.is_variable && <Chip size="small" label="varies" sx={{ ml: 0.5 }} />}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatMoney(Number(inc.amount))} · {inc.recurrence.replace("_", " ")}
                  {inc.next_date ? ` · next ${formatDate(inc.next_date)}` : ""}
                </Typography>
              </Box>
              <Button size="small" color="error" disabled={pending} onClick={() => run(() => deleteIncome(inc.id))}>
                Delete
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
