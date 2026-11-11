import { redirect } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NavTabs from "@/components/dashboard/NavTabs";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h3" component="span" sx={{ flexGrow: 1, color: "inherit" }}>
            ADHD Budget
          </Typography>
          <form action="/auth/signout" method="post">
            <Button type="submit" color="inherit" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.6)" }}>
              Log out
            </Button>
          </form>
        </Toolbar>
        <Box sx={{ px: 1, bgcolor: "primary.dark" }}>
          <Container maxWidth="md" disableGutters>
            <NavTabs />
          </Container>
        </Box>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
