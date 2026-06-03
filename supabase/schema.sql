-- WM Sticker Swap Fröndenberg
-- Dieses SQL legst du in Supabase im SQL Editor an und klickst dann auf "Run".

create type public.sticker_liste as enum ('habe', 'suche');
create type public.abgabe_art as enum ('tausch', 'verschenken', 'verkauf');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  ort text not null,
  kontakt_whatsapp text,
  kontakt_email text,
  kontakt_telefon text,
  email_benachrichtigungen boolean not null default true,
  onboarding_abgeschlossen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_code text not null,
  anzahl integer not null default 1 check (anzahl > 0),
  liste public.sticker_liste not null,
  abgabe_art public.abgabe_art,
  preis_vorschlag numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habe_braucht_abgabe_art check (
    (liste = 'habe' and abgabe_art is not null)
    or (liste = 'suche' and abgabe_art is null)
  ),
  constraint verkauf_preis_optional check (
    preis_vorschlag is null or preis_vorschlag >= 0
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete cascade,
  sticker_code text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_stickers_user_id_idx on public.user_stickers(user_id);
create index user_stickers_sticker_code_idx on public.user_stickers(sticker_code);
create index user_stickers_liste_idx on public.user_stickers(liste);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_at_idx on public.notifications(read_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    nickname,
    ort,
    kontakt_email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', 'Sammler'),
    coalesce(new.raw_user_meta_data ->> 'ort', 'Fröndenberg-Vorort'),
    new.email
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

alter table public.profiles enable row level security;
alter table public.user_stickers enable row level security;
alter table public.notifications enable row level security;

-- PROFILE
-- Jeder eingeloggte Nutzer darf sein eigenes Profil lesen, anlegen und ändern.
create policy "Eigenes Profil lesen"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Eigenes Profil anlegen"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Eigenes Profil ändern"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Eigenes Profil löschen"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

-- STICKER
-- Alle eingeloggten Nutzer dürfen Stickerlisten lesen.
-- So können Angebote und Suchlisten abgeglichen werden.
create policy "Stickerlisten lesen"
on public.user_stickers for select
to authenticated
using (true);

-- Schreiben, ändern und löschen darf jeder nur bei den eigenen Stickern.
create policy "Eigene Sticker anlegen"
on public.user_stickers for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Eigene Sticker ändern"
on public.user_stickers for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Eigene Sticker löschen"
on public.user_stickers for delete
to authenticated
using (auth.uid() = user_id);

create policy "Eigene Benachrichtigungen lesen"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

create policy "Eigene Benachrichtigungen ändern"
on public.notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.create_match_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.liste <> 'habe' then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    actor_user_id,
    sticker_code,
    message
  )
  select
    searcher.user_id,
    new.user_id,
    new.sticker_code,
    'Eine deiner gesuchten Karten ist im Angebot!'
  from public.user_stickers searcher
  join public.profiles searcher_profile
    on searcher_profile.id = searcher.user_id
  where searcher.liste = 'suche'
    and searcher.sticker_code = new.sticker_code
    and searcher.user_id <> new.user_id
    and searcher_profile.email_benachrichtigungen = true;

  return new;
end;
$$;

create trigger on_user_sticker_match_notification
after insert on public.user_stickers
for each row execute function public.create_match_notifications();

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
