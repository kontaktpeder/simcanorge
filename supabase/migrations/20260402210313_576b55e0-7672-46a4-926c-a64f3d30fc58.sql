
-- feed_posts
create table if not exists public.feed_posts (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  author_profile_id    uuid        not null references public.person_profiles(id) on delete cascade,
  post_type            text        not null default 'manual',
  body                 text,
  car_id               uuid        references public.cars(id) on delete set null,
  marketplace_item_id  uuid        references public.marketplace_items(id) on delete set null,
  event_id             uuid        references public.events(id) on delete set null,
  snapshot_title       text,
  snapshot_image_url   text,
  snapshot_entity_type text,
  is_visible           boolean     not null default true
);

alter table public.feed_posts enable row level security;

create policy "Alle kan lese synlige poster"
  on public.feed_posts for select using (is_visible = true);

create policy "Eier kan opprette"
  on public.feed_posts for insert
  with check (author_profile_id in (
    select id from public.person_profiles where user_id = auth.uid()
  ));

create policy "Eier kan slette"
  on public.feed_posts for delete
  using (author_profile_id in (
    select id from public.person_profiles where user_id = auth.uid()
  ));

create policy "Admin kan administrere feed_posts"
  on public.feed_posts for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index feed_posts_created_at_idx on public.feed_posts(created_at desc);

-- feed_post_likes
create table if not exists public.feed_post_likes (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  post_id    uuid        not null references public.feed_posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  unique (post_id, user_id)
);

alter table public.feed_post_likes enable row level security;

create policy "Alle kan se likes"
  on public.feed_post_likes for select using (true);

create policy "Innlogget kan like"
  on public.feed_post_likes for insert
  with check (user_id = auth.uid());

create policy "Innlogget kan unlike"
  on public.feed_post_likes for delete
  using (user_id = auth.uid());

create policy "Admin kan administrere likes"
  on public.feed_post_likes for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
