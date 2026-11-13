"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { connectSimulatedBank } from "@/app/dashboard/actions";
import { addIncome } from "@/app/dashboard/safe-to-spend/actions";
import { updateSettings } from "@/app/dashboard/settings/actions";
import { completeOnboarding } from "@/app/setup/actions";
import { addDaysISO, todayISO } from "@/lib/budget/recurrence";

const STEPS = ["Welcome", "Spending", "Income", "Preferences", "Done"];

export default function SetupWizard({ name, hasAccounts }: { name: string; hasAccounts: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(hasAccounts);

  // income fields
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("monthly");
  const [nextDate, setNextDate] = useState(addDaysISO(todayISO(), 14));
  // preference fields
  const [buffer, setBuffer] = useState("50");
  const [lead, setLead] = useState("3");
  const [tone, setTone] = useState("gentle");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function run(fn: () => Promise<{ ok?: true; error?: string }>, onOk: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else onOk();
    });
  }

  function handleConnect() {
    run(connectSimulatedBank, () => {
      setConnected(true);
      next();
    });
  }
  function handleAddIncome() {
    const fd = new FormData();
    fd.set("source_name", source);
    fd.set("amount", amount);
    fd.set("recurrence", freq);
    fd.set("next_date", freq === "irregular" ? "" : nextDate);
    run(() => addIncome(fd), next);
  }
  function handleSavePrefs() {
    const fd = new FormData();
    fd.set("safe_to_spend_buffer", buffer);
    fd.set("reminder_lead_days", lead);
    fd.set("reminder_style", tone);
    fd.set("density", "calm");
    fd.set("notifications_enabled", "on");
    run(() => updateSettings(fd), next);
  }
  function handleFinish() {
    run(completeOnboarding, () => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">
            Step {step + 1} of {STEPS.length}
          </Typography>
          <LinearProgress variant="determinate" value={((step + 1) / STEPS.length) * 100} sx={{ my: 1.5, height: 8, borderRadius: 4 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {step === 0 && (
            <Stack spacing={2}>
              <Typography variant="h2" component="h1">
                Welcome, {name} 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Let&apos;s set you up in about a minute: bring in your spending, add your
                income, and pick a cushion. You can skip anything and change it later.
              </Typography>
              <Box>
                <Button variant="contained" size="large" onClick={next}>
                  Get started
                </Button>
              </Box>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2}>
              <Typography variant="h2" component="h1">
                Bring in your spending
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Connect a bank and we&apos;ll pull in your recent transactions automatically.
                This demo uses safe, simulated data.
              </Typography>
              {connected && <Alert severity="success">Your account is connected.</Alert>}
              <Stack direction="row" spacing={2}>
                {!connected ? (
                  <Button variant="contained" size="large" onClick={handleConnect} disabled={pending}>
                    {pending ? "Connecting…" : "Connect a bank"}
                  </Button>
                ) : (
                  <Button variant="contained" size="large" onClick={next}>
                    Next
                  </Button>
                )}
                <Button size="large" onClick={next} disabled={pending}>
                  Skip
                </Button>
              </Stack>
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Typography variant="h2" component="h1">
                Add an income source
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Even a rough, variable amount helps us work out what&apos;s safe to spend.
              </Typography>
              <TextField label="Source (e.g. Job, Gig)" value={source} onChange={(e) => setSource(e.target.value)} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Amount" type="number" inputProps={{ step: "0.01", min: "0" }} value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ flex: 1 }} />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel id="wiz-freq">Frequency</InputLabel>
                  <Select labelId="wiz-freq" label="Frequency" value={freq} onChange={(e) => setFreq(e.target.value)}>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Every 2 weeks</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="irregular">Irregular</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <TextField label="Next expected" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} InputLabelProps={{ shrink: true }} disabled={freq === "irregular"} />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" size="large" onClick={handleAddIncome} disabled={pending || !source || !amount}>
                  {pending ? "Saving…" : "Add income"}
                </Button>
                <Button size="large" onClick={next} disabled={pending}>
                  Skip
                </Button>
              </Stack>
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={2}>
              <Typography variant="h2" component="h1">
                Your preferences
              </Typography>
              <TextField label="Safe-to-spend buffer (keep aside)" type="number" inputProps={{ step: "1", min: "0" }} value={buffer} onChange={(e) => setBuffer(e.target.value)} />
              <TextField label="Remind me this many days before a bill" type="number" inputProps={{ step: "1", min: "0", max: "30" }} value={lead} onChange={(e) => setLead(e.target.value)} />
              <FormControl>
                <InputLabel id="wiz-tone">Reminder tone</InputLabel>
                <Select labelId="wiz-tone" label="Reminder tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  <MenuItem value="gentle">Gentle</MenuItem>
                  <MenuItem value="direct">Direct</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" size="large" onClick={handleSavePrefs} disabled={pending}>
                  {pending ? "Saving…" : "Save & continue"}
                </Button>
                <Button size="large" onClick={next} disabled={pending}>
                  Skip
                </Button>
              </Stack>
            </Stack>
          )}

          {step === 4 && (
            <Stack spacing={2}>
              <Typography variant="h2" component="h1">
                You&apos;re all set 🎉
              </Typography>
              <Typography variant="body1" color="text.secondary">
                That&apos;s the setup done. Your dashboard will show what&apos;s safe to spend,
                what&apos;s coming up, and where your money went — calmly.
              </Typography>
              <Box>
                <Button variant="contained" size="large" onClick={handleFinish} disabled={pending}>
                  {pending ? "Finishing…" : "Go to my dashboard"}
                </Button>
              </Box>
            </Stack>
          )}

          {step > 0 && step < 4 && (
            <Box sx={{ mt: 3 }}>
              <Button onClick={back} disabled={pending} size="small">
                Back
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
