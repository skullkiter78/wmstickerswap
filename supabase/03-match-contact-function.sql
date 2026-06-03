-- Gibt Kontaktdaten nur zurück, wenn zwischen eingeloggtem Nutzer
-- und Zielperson mindestens ein Sticker-Treffer besteht.

create or replace function public.get_match_contact(target_user_id uuid)
returns table (
  kontakt_whatsapp text,
  kontakt_email text,
  kontakt_telefon text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.kontakt_whatsapp,
    profiles.kontakt_email,
    profiles.kontakt_telefon
  from public.profiles
  where profiles.id = target_user_id
    and auth.uid() is not null
    and auth.uid() <> target_user_id
    and exists (
      select 1
      from public.user_stickers mine
      join public.user_stickers theirs
        on mine.sticker_code = theirs.sticker_code
      where mine.user_id = auth.uid()
        and theirs.user_id = target_user_id
        and (
          (mine.liste = 'suche' and theirs.liste = 'habe')
          or (mine.liste = 'habe' and theirs.liste = 'suche')
        )
    );
$$;

grant execute on function public.get_match_contact(uuid) to authenticated;
