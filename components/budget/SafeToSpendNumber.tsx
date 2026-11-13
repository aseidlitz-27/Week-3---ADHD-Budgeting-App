import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SafeToSpend } from "@/lib/budget/safeToSpend";
import { formatDate, formatMoney } from "@/lib/budget/format";

/** The glanceable "safe to spend today" number. */
export default function SafeToSpendNumber({ sts, compact = false }: { sts: SafeToSpend; compact?: boolean }) {
  const negative = sts.safe < 0;
  const display = Math.max(0, sts.safe);
  const until = sts.nextIncomeDate
    ? `until your next income on ${formatDate(sts.nextIncomeDate)}`
    : `over the next ${sts.days} days`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2.5 : 3.5,
        borderRadius: 3,
        border: 2,
        borderColor: negative ? "error.main" : "primary.main",
        bgcolor: negative ? "error.light" : "background.paper",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Safe to spend today
      </Typography>
      <Typography
        variant="h1"
        component="p"
        sx={{ fontSize: compact ? "2.25rem" : "3rem", color: negative ? "error.main" : "primary.main", my: 0.5 }}
      >
        {formatMoney(display)}
      </Typography>
      {negative ? (
        <Typography variant="body2" color="error.main">
          Your bills {until} come to more than you have spare. Hold off on extra spending
          if you can.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          You can spend this much and still cover your bills {until}
          {sts.buffer > 0 ? `, keeping your ${formatMoney(sts.buffer)} buffer` : ""}.
        </Typography>
      )}
      {!compact && (
        <Box sx={{ mt: 1.5, display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary">
            Balance {formatMoney(sts.currentBalance)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upcoming bills −{formatMoney(sts.upcomingBills)}
          </Typography>
          {sts.buffer > 0 && (
            <Typography variant="caption" color="text.secondary">
              Buffer −{formatMoney(sts.buffer)}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}
