"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connectSimulatedBank } from "@/app/dashboard/actions";

export default function ConnectBankButton({ label = "Connect a bank" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await connectSimulatedBank();
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" onClick={handleClick} disabled={pending}>
        {pending ? "Connecting…" : label}
      </Button>
    </Stack>
  );
}
