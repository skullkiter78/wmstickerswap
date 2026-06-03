# Setup-Notizen

## Supabase SQL nachziehen

Wenn du schon ein Supabase-Projekt hast, führe diese Dateien im SQL Editor aus:

1. `supabase/02-public-profiles-function.sql`
2. `supabase/03-match-contact-function.sql`
3. `supabase/04-notifications.sql`
4. `supabase/05-delete-own-account.sql`

## E-Mail-Benachrichtigungen mit Resend

1. Konto bei Resend erstellen.
2. API-Key erzeugen.
3. In Supabase Edge Functions Secrets setzen:

```text
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Sticker Swap <deine-verifizierte-adresse@domain.de>
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Edge Function `send-match-email` deployen.
5. In Supabase einen Database Webhook auf `public.notifications` bei `INSERT` anlegen.
6. Ziel-URL ist die Supabase Edge Function URL.

Die App funktioniert auch ohne E-Mail-Versand: Im Dashboard erscheinen neue Treffer direkt nach dem Login.
