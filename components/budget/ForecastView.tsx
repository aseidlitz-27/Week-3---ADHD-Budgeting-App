import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Forecast } from "@/lib/budget/forecast";
import { formatDate, formatMoney } from "@/lib/budget/format";

export default function ForecastView({ forecast }: { forecast: Forecast }) {
  const { startBalance, events, lowest, lowestDate, firstNegativeDate, buffer } = forecast;

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          Balance today
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {formatMoney(startBalance)}
        </Typography>
      </Box>

      {firstNegativeDate ? (
        <Alert severity="warning">
          Heads up — on <b>{formatDate(firstNegativeDate)}</b> your projected balance dips
          below {buffer > 0 ? `your ${formatMoney(buffer)} buffer` : "zero"} (down to{" "}
          {formatMoney(lowest)}). Consider moving money or a bill.
        </Alert>
      ) : (
        <Alert severity="success">
          You stay above {buffer > 0 ? `your ${formatMoney(buffer)} buffer` : "zero"} for the next
          45 days. Lowest point: {formatMoney(lowest)}
          {lowestDate ? ` on ${formatDate(lowestDate)}` : ""}.
        </Alert>
      )}

      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No upcoming bills or income to project yet.
        </Typography>
      ) : (
        <Stack divider={<Divider />} spacing={0}>
          {events.map((e, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {e.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(e.date)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: e.delta < 0 ? "text.primary" : "success.main" }}>
                  {e.delta < 0 ? "−" : "+"}
                  {formatMoney(Math.abs(e.delta))}
                </Typography>
                <Typography variant="caption" sx={{ color: e.balance < buffer ? "error.main" : "text.secondary" }}>
                  → {formatMoney(e.balance)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
