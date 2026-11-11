"use client";

import { useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <Stack spacing={2}>
          <Alert severity="success">
            If an account exists for <b>{email}</b>, we sent a link to reset your
            password.
          </Alert>
          <Button component={NextLink} href="/login" variant="outlined" fullWidth>
            Back to log in
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            <Link component={NextLink} href="/login">
              Back to log in
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
