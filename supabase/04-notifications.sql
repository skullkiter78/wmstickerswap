-- Neue Treffer-Benachrichtigungen
-- Wenn jemand einen Sticker als "Habe doppelt" einträgt,
-- bekommen passende Suchende eine ungelesene Benachrichtigung.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete cascade,
  sticker_code text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
on public.notifications(user_id);

create index if not exists notifications_read_at_idx
on public.notifications(read_at);

alter table public.notifications enable row level security;

drop policy if exists "Eigene Benachrichtigungen lesen" on public.notifications;
drop policy if exists "Eigene Benachrichtigungen ändern" on public.notifications;

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
  where searcher.liste = 'suche'
    and searcher.sticker_code = new.sticker_code
    and searcher.user_id <> new.user_id;

  return new;
end;
$$;

drop trigger if exists on_user_sticker_match_notification
on public.user_stickers;

create trigger on_user_sticker_match_notification
after insert on public.user_stickers
for each row execute function public.create_match_notifications();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_stickers'
  ) then
    alter publication supabase_realtime add table public.user_stickers;
  end if;
end;
$$;
