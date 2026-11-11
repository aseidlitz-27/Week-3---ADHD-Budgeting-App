import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/** Calm, centered wrapper for the auth screens. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h2" component="h1">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
