import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatMoney } from "@/lib/budget/format";

export type CategorySlice = { name: string; color: string | null; total: number };

/** Calm, sparse category breakdown — bars instead of a busy pie chart. */
export default function WhereItWent({ slices }: { slices: CategorySlice[] }) {
  const max = Math.max(1, ...slices.map((s) => s.total));
  if (slices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No spending yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {slices.map((s) => (
        <Box key={s.name}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {s.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatMoney(s.total)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(s.total / max) * 100}
            aria-label={`${s.name}: ${formatMoney(s.total)}`}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { bgcolor: s.color || "primary.main", borderRadius: 5 },
            }}
          />
        </Box>
      ))}
    </Stack>
  );
}
