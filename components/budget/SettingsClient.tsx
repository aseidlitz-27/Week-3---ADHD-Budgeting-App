"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { updateSettings } from "@/app/dashboard/settings/actions";

export type SettingsRow = {
  safe_to_spend_buffer: number;
  reminder_lead_days: number;
  reminder_style: string;
  density: string;
  notifications_enabled: boolean;
};

export default function SettingsClient({ settings }: { settings: SettingsRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [buffer, setBuffer] = useState(String(settings.safe_to_spend_buffer ?? 0));
  const [lead, setLead] = useState(String(settings.reminder_lead_days ?? 3));
  const [style, setStyle] = useState(settings.reminder_style ?? "gentle");
  const [density, setDensity] = useState(settings.density ?? "calm");
  const [notify, setNotify] = useState(Boolean(settings.notifications_enabled));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("safe_to_spend_buffer", buffer);
    fd.set("reminder_lead_days", lead);
    fd.set("reminder_style", style);
    fd.set("density", density);
    fd.set("notifications_enabled", notify ? "on" : "");
    startTransition(async () => {
      const res = await updateSettings(fd);
      if (res.error) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: "Saved." });
        router.refresh();
      }
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {msg && <Alert severity={msg.ok ? "success" : "error"}>{msg.text}</Alert>}

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Safe-to-spend buffer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            A cushion we always keep aside, so &quot;safe to spend&quot; never empties your account.
          </Typography>
          <TextField
            label="Buffer amount"
            type="number"
            inputProps={{ step: "1", min: "0" }}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
          />
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Reminders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            How and when we nudge you about bills.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
              label="Show bill reminders"
            />
            <TextField
              label="Remind me this many days before a bill"
              type="number"
              inputProps={{ step: "1", min: "0", max: "30" }}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              disabled={!notify}
              sx={{ maxWidth: 320 }}
            />
            <FormControl sx={{ maxWidth: 320 }} disabled={!notify}>
              <InputLabel id="style-label">Reminder tone</InputLabel>
              <Select labelId="style-label" label="Reminder tone" value={style} onChange={(e) => setStyle(e.target.value)}>
                <MenuItem value="gentle">Gentle</MenuItem>
                <MenuItem value="direct">Direct</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Appearance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Choose how much breathing room the screens have.
          </Typography>
          <FormControl sx={{ maxWidth: 320 }}>
            <InputLabel id="density-label">Density</InputLabel>
            <Select labelId="density-label" label="Density" value={density} onChange={(e) => setDensity(e.target.value)}>
              <MenuItem value="calm">Calm (more space)</MenuItem>
              <MenuItem value="compact">Compact (more on screen)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
