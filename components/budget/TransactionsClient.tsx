"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { addManualTransaction, recategorizeTransaction } from "@/app/dashboard/actions";
import { formatDate, formatMoney } from "@/lib/budget/format";

type Cat = { id: string; name: string };
type Acct = { id: string; name: string };
type Txn = {
  id: string;
  amount: number;
  type: "expense" | "income";
  merchant: string | null;
  occurred_on: string;
  category_id: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionsClient({
  transactions,
  categories,
  accounts,
}: {
  transactions: Txn[];
  categories: Cat[];
  accounts: Acct[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // add-form state
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(today());

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("merchant", merchant);
    fd.set("type", type);
    fd.set("account_id", accountId);
    fd.set("category_id", type === "expense" ? categoryId : "");
    fd.set("occurred_on", date);
    startTransition(async () => {
      const res = await addManualTransaction(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setAmount("");
      setMerchant("");
      setCategoryId("");
      setDate(today());
      router.refresh();
    });
  }

  function handleRecategorize(txnId: string, newCatId: string, m: string | null) {
    startTransition(async () => {
      const res = await recategorizeTransaction(txnId, newCatId, m);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Add a transaction
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Amount"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Merchant / description"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                sx={{ flex: 2 }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "expense" | "income")}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }} required>
                <InputLabel id="account-label">Account</InputLabel>
                <Select
                  labelId="account-label"
                  label="Account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl sx={{ flex: 1 }} disabled={type === "income"}>
                <InputLabel id="cat-label">Category</InputLabel>
                <Select
                  labelId="cat-label"
                  label="Category"
                  value={type === "income" ? "" : categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Auto</em>
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Box>
              <Button type="submit" variant="contained" disabled={pending}>
                {pending ? "Saving…" : "Add transaction"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          All transactions
        </Typography>
        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No transactions yet.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={0}>
            {transactions.map((t) => (
              <Box
                key={t.id}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.5, flexWrap: "wrap" }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {t.merchant ?? "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(t.occurred_on)} · {t.type === "income" ? "Income" : catName(t.category_id)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {t.type === "expense" && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={t.category_id ?? ""}
                        displayEmpty
                        onChange={(e) => handleRecategorize(t.id, e.target.value, t.merchant)}
                        disabled={pending}
                        aria-label={`Category for ${t.merchant ?? "transaction"}`}
                      >
                        <MenuItem value="" disabled>
                          <em>Set category</em>
                        </MenuItem>
                        {categories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, minWidth: 90, textAlign: "right", color: t.type === "income" ? "success.main" : "text.primary" }}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(Number(t.amount))}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
