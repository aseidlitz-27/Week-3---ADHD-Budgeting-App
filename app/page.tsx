import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={NextLink} href="/signup" variant="contained" size="large">
              Create your account
            </Button>
            <Button component={NextLink} href="/login" variant="outlined" size="large">
              Log in
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
