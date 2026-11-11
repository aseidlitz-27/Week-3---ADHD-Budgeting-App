import { redirect } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name || user.email?.split("@")[0] || "there";

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h3" component="span" sx={{ flexGrow: 1, color: "inherit" }}>
            ADHD Budget
          </Typography>
          <form action="/auth/signout" method="post">
            <Button type="submit" color="inherit" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.6)" }}>
              Log out
            </Button>
          </form>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Stack spacing={3}>
          <Typography variant="h1" component="h1">
            Hi {name} 👋
          </Typography>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
            <Typography variant="body1" gutterBottom>
              You&apos;re signed in, and your private space is ready. Your account,
              settings, and default spending categories were set up for you.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Next, we&apos;ll add your accounts, transactions, bills, and the
              &ldquo;safe to spend today&rdquo; number — each one building on this
              secure foundation.
            </Typography>
          </Paper>
          <Typography variant="body2" color="text.secondary">
            Signed in as {user.email}.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
