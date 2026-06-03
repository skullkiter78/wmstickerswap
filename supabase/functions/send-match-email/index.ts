import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type NotificationPayload = {
  record?: {
    id: string;
    user_id: string;
    actor_user_id: string | null;
    sticker_code: string;
    message: string;
  };
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!resendApiKey || !fromEmail || !supabaseUrl || !serviceRoleKey) {
    return new Response("Missing environment variables", { status: 500 });
  }

  const payload = (await req.json()) as NotificationPayload;
  const notification = payload.record;

  if (!notification) {
    return new Response("No notification record", { status: 400 });
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${notification.user_id}&select=kontakt_email,email_benachrichtigungen`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  );
  const [profile] = await profileResponse.json();

  if (!profile?.kontakt_email || !profile?.email_benachrichtigungen) {
    return new Response("No email wanted", { status: 200 });
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: profile.kontakt_email,
      subject: "Neue Sticker-Treffer in deiner Tauschbörse",
      text: `${notification.message}\n\nSticker-Code: ${notification.sticker_code}\n\nSchau in dein Sticker-Swap-Dashboard, um den Treffer anzusehen.`,
    }),
  });

  return new Response("ok", { status: 200 });
});
