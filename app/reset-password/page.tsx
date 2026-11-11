"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please use a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          {done && <Alert severity="success">Password updated. Taking you in…</Alert>}
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            helperText="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || done}>
            {loading ? "Saving…" : "Save new password"}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
