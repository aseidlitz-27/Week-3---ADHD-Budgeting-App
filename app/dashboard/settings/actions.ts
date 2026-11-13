"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok?: true; error?: string };

export async function updateSettings(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const buffer = Number(formData.get("safe_to_spend_buffer"));
  const lead = parseInt(String(formData.get("reminder_lead_days")), 10);
  const reminder_style = String(formData.get("reminder_style") ?? "gentle") === "direct" ? "direct" : "gentle";
  const density = String(formData.get("density") ?? "calm") === "compact" ? "compact" : "calm";
  const notifications_enabled = String(formData.get("notifications_enabled") ?? "") === "on";

  if (Number.isNaN(buffer) || buffer < 0) return { error: "Buffer must be zero or more." };
  if (Number.isNaN(lead) || lead < 0 || lead > 30) return { error: "Reminder lead days must be between 0 and 30." };

  const { error } = await supabase
    .from("settings")
    .update({
      safe_to_spend_buffer: buffer,
      reminder_lead_days: lead,
      reminder_style,
      density,
      notifications_enabled,
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
