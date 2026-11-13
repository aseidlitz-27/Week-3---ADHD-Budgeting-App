import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SafeToSpend } from "@/lib/budget/safeToSpend";
import { formatDate, formatMoney } from "@/lib/budget/format";

/** Smooths spending across the pay period and warns on early over-spend. */
export default function PaydayBuffer({ sts, spentToday }: { sts: SafeToSpend; spentToday: number }) {
  const overToday = spentToday > sts.perDay && sts.perDay > 0;

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Safe per day
          </Typography>
          <Typography variant="h3" component="p">
            {formatMoney(sts.perDay)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Days to cover
          </Typography>
          <Typography variant="h3" component="p">
            {sts.days}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {sts.nextIncomeDate ? "Next income" : "Window ends"}
          </Typography>
          <Typography variant="h3" component="p">
            {formatDate(sts.nextIncomeDate ?? sts.windowEnd)}
          </Typography>
        </Box>
      </Box>

      {overToday ? (
        <Alert severity="warning">
          You&apos;ve spent {formatMoney(spentToday)} today — above your {formatMoney(sts.perDay)}{" "}
          daily pace. No shame, just a heads-up so the end of the period stays comfortable.
        </Alert>
      ) : (
        <Alert severity="info">
          Spending up to about {formatMoney(sts.perDay)} a day keeps you on track until{" "}
          {formatDate(sts.nextIncomeDate ?? sts.windowEnd)}.
        </Alert>
      )}
    </Stack>
  );
}
