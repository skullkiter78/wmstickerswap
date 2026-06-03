# WM Sticker Swap Fröndenberg

Lokale, nicht-kommerzielle Web-App für eine Panini-WM-2026-Sticker-Tauschbörse im Umkreis Fröndenberg.

## Lokal starten

```powershell
cd "C:\Users\benad\OneDrive\Dokumente\WM Sticker Swap"
npm run dev
```

Dann im Browser öffnen:

```text
http://localhost:3000
```

Auf dem Handy im gleichen WLAN nutzt du die `Network`-Adresse, die Next.js im Terminal anzeigt.

## Prüfen

```powershell
npm run lint
npm run build
```

## Supabase SQL

Für ein frisches Projekt reicht `supabase/schema.sql`.

Wenn das Projekt schon läuft, diese Zusatzdateien im Supabase SQL Editor ausführen:

```text
supabase/02-public-profiles-function.sql
supabase/03-match-contact-function.sql
supabase/04-notifications.sql
supabase/05-delete-own-account.sql
```

## Umgebungsvariablen

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Funktionen

- Registrierung/Login mit Supabase
- Profil mit Nickname, Wohnort und optionalen Kontaktwegen
- Datenschutz-Hinweis mit Checkbox bei Registrierung
- Impressum unter `/impressum`
- Stickerlisten: `Habe doppelt` und `Suche noch`
- echter 980er Katalog aus `data/katalog.json`
- Stöbern mit Filter nach Sticker und Ort
- automatische Treffer mit Score
- perfekter Match wird hervorgehoben
- Kontaktbuttons nur bei Treffer
- Tauschvorschlag mit konkreter Stickerauswahl
- Dashboard-Hinweis für neue Treffer
- PWA-Grundlage mit Manifest, Icon und Service Worker
- dädd-design Gutschein und Sponsorflächen

## E-Mail-Benachrichtigungen

Die App zeigt neue Treffer im Dashboard auch ohne E-Mail an.

Für E-Mail-Versand siehe:

```text
docs/setup.md
```
