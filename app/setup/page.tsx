import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SetupWizard from "@/components/setup/SetupWizard";

export default async function SetupPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,onboarding_completed")
    .eq("id", user.id)
    .single();
  if (profile?.onboarding_completed) redirect("/dashboard");

  const { data: accounts } = await supabase.from("accounts").select("id").limit(1);
  const name = profile?.display_name || user.email?.split("@")[0] || "there";

  return <SetupWizard name={name} hasAccounts={!!(accounts && accounts.length)} />;
}
