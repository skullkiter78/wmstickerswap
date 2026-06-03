-- Schritt nach dem ersten Setup:
-- Diese Funktion erlaubt der App, von anderen Nutzern nur Nickname und Ort zu lesen.
-- Kontaktdaten wie WhatsApp, E-Mail und Telefon werden hier NICHT ausgegeben.

create or replace function public.get_public_profiles()
returns table (
  id uuid,
  nickname text,
  ort text
)
language sql
security definer
set search_path = public
as $$
  select profiles.id, profiles.nickname, profiles.ort
  from public.profiles;
$$;

grant execute on function public.get_public_profiles() to authenticated;
