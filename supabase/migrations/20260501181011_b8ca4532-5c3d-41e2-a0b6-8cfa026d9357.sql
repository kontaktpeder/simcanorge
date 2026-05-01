create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_name text not null,
  screen text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_events_event_name_not_empty check (char_length(trim(event_name)) > 0)
);

create index if not exists idx_product_events_created_at
  on public.product_events(created_at desc);

create index if not exists idx_product_events_event_name
  on public.product_events(event_name);

create index if not exists idx_product_events_user_id
  on public.product_events(user_id);

alter table public.product_events enable row level security;

drop policy if exists "product_events_insert_anon_auth" on public.product_events;
create policy "product_events_insert_anon_auth"
  on public.product_events
  for insert
  to anon, authenticated
  with check (
    user_id is null or user_id = auth.uid()
  );

drop policy if exists "product_events_admin_select" on public.product_events;
create policy "product_events_admin_select"
  on public.product_events
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.log_product_event(
  p_event_name text,
  p_screen text default null,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if p_event_name is null or char_length(trim(p_event_name)) = 0 then
    raise exception 'event_name_required' using errcode = 'P0001';
  end if;

  insert into public.product_events (user_id, event_name, screen, payload)
  values (_uid, trim(p_event_name), nullif(trim(p_screen), ''), coalesce(p_payload, '{}'::jsonb));
end;
$$;

revoke all on function public.log_product_event(text, text, jsonb) from public;
grant execute on function public.log_product_event(text, text, jsonb) to anon, authenticated;