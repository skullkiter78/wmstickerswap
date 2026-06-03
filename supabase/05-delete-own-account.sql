-- Nutzer können ihr eigenes Konto löschen.
-- Das löscht den auth.users-Eintrag; durch on delete cascade verschwinden
-- Profil, Stickerlisten und Benachrichtigungen.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht eingeloggt.';
  end if;

  delete from auth.users
  where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
