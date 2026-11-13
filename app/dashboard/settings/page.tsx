import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import SettingsClient, { type SettingsRow } from "@/components/budget/SettingsClient";
import PrivacyControls from "@/components/budget/PrivacyControls";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("safe_to_spend_buffer,reminder_lead_days,reminder_style,density,notifications_enabled")
    .eq("user_id", user!.id)
    .single();

  return (
    <Stack spacing={3}>
      <Typography variant="h1" component="h1">
        Settings
      </Typography>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <SettingsClient settings={(settings ?? {
          safe_to_spend_buffer: 0,
          reminder_lead_days: 3,
          reminder_style: "gentle",
          density: "calm",
          notifications_enabled: true,
        }) as SettingsRow} />
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Privacy &amp; your data
        </Typography>
        <PrivacyControls />
      </Paper>
    </Stack>
  );
}
