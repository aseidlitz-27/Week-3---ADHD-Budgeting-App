"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { recordReward } from "@/app/dashboard/actions";
import type { Milestone } from "@/lib/budget/rewards";

export default function RewardsCard({ milestones, recorded }: { milestones: Milestone[]; recorded: string[] }) {
  const recordedSet = new Set(recorded);
  const met = milestones.filter((m) => m.met);
  const newly = met.filter((m) => !recordedSet.has(m.kind));
  const didRun = useRef(false);
  const [celebrate] = useState(newly.length > 0);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    // Persist any newly earned wins (fire and forget).
    newly.forEach((m) => {
      void recordReward(m.kind);
    });
  }, [newly]);

  if (met.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Your wins will show up here as you go. No streaks, no pressure.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {celebrate && (
        <Alert severity="success">
          Nice work! You just earned: {newly.map((m) => `${m.emoji} ${m.title}`).join(", ")}.
        </Alert>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {met.map((m) => (
          <Chip key={m.kind} label={`${m.emoji} ${m.title}`} color="success" variant="outlined" />
        ))}
      </Box>
    </Stack>
  );
}
