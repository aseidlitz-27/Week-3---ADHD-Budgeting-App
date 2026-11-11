"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { addBill, markBillPaid, deleteBill } from "@/app/dashboard/bills/actions";
import { formatDate, formatMoney } from "@/lib/budget/format";
import { addDaysISO, todayISO } from "@/lib/budget/recurrence";

type Acct = { id: string; name: string };
export type BillRow = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  status: "unpaid" | "paid";
  is_subscription: boolean;
};

export default function BillsClient({ bills, accounts }: { bills: BillRow[]; accounts: Acct[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(addDaysISO(todayISO(), 7));
  const [recurrence, setRecurrence] = useState("monthly");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

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
    fd.set("name", name);
    fd.set("amount", amount);
    fd.set("due_date", due);
    fd.set("recurrence", recurrence);
    fd.set("account_id", accountId);
    run(
      () => addBill(fd),
      () => {
        setName("");
        setAmount("");
        setDue(addDaysISO(todayISO(), 7));
      },
    );
  }

  const today = todayISO();
  const soon = addDaysISO(today, 7);
  const unpaid = bills.filter((b) => b.status === "unpaid");
  const overdue = unpaid.filter((b) => b.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const dueSoon = unpaid.filter((b) => b.due_date >= today && b.due_date <= soon).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const later = unpaid.filter((b) => b.due_date > soon).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paid = bills.filter((b) => b.status === "paid");

  function BillItem({ b }: { b: BillRow }) {
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.5, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {b.name}{" "}
            {b.is_subscription && <Chip size="small" label="Subscription" sx={{ ml: 0.5 }} />}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Due {formatDate(b.due_date)} · {b.recurrence === "none" ? "one-off" : b.recurrence}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {formatMoney(Number(b.amount))}
          </Typography>
          {b.status === "unpaid" && (
            <Button size="small" variant="contained" disabled={pending} onClick={() => run(() => markBillPaid(b.id))}>
              Mark paid
            </Button>
          )}
          <Button size="small" color="error" disabled={pending} onClick={() => run(() => deleteBill(b.id))}>
            Delete
          </Button>
        </Box>
      </Box>
    );
  }

  function Group({ title, items, color }: { title: string; items: BillRow[]; color?: string }) {
    if (items.length === 0) return null;
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: color ?? "text.secondary", mb: 0.5 }}>
          {title}
        </Typography>
        <Stack divider={<Divider />} spacing={0}>
          {items.map((b) => (
            <BillItem key={b.id} b={b} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      {dueSoon.length + overdue.length > 0 && (
        <Alert severity={overdue.length ? "warning" : "info"}>
          {overdue.length > 0
            ? `${overdue.length} bill${overdue.length > 1 ? "s are" : " is"} overdue.`
            : `${dueSoon.length} bill${dueSoon.length > 1 ? "s are" : " is"} due in the next 7 days.`}{" "}
          We&apos;ll keep reminding you here.
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Add a bill
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 2 }} />
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
              <TextField
                label="Due date"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="rec-label">Repeats</InputLabel>
                <Select labelId="rec-label" label="Repeats" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                  <MenuItem value="none">One-off</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="acct-label">Account</InputLabel>
                <Select labelId="acct-label" label="Account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Box>
              <Button type="submit" variant="contained" disabled={pending}>
                {pending ? "Saving…" : "Add bill"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Your bills
        </Typography>
        {bills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No bills yet. Add one above so we can remind you before it&apos;s due.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Group title="Overdue" items={overdue} color="error.main" />
            <Group title="Due soon" items={dueSoon} color="warning.main" />
            <Group title="Later" items={later} />
            <Group title="Paid" items={paid} />
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
