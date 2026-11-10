import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Typography variant="h1" component="h1">
            Budgeting that carries the mental load
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A calm budgeting app for adults with ADHD. It does the remembering,
            tracking, and timing for you — and helps the moment you&apos;re about
            to spend, not in a monthly report you&apos;ll never open.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Foundation in place: Next.js + Material UI, deploying on Vercel, data
            on Supabase. Features are being built one at a time.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
