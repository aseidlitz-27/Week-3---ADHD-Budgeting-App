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

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Please use a password of at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: { display_name: displayName || undefined },
      },
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
            We sent a confirmation link to <b>{email}</b>. Open it to activate your
            account, then log in.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Didn&apos;t get it? Check spam, or wait a minute and try again.
          </Typography>
          <Button component={NextLink} href="/login" variant="outlined" fullWidth>
            Go to log in
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Budgeting that carries the mental load — let's set you up."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Your name (optional)"
            autoComplete="name"
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            helperText="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link component={NextLink} href="/login">
              Log in
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
