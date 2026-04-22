-- Relationship enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'car_relationship_type') then
    create type public.car_relationship_type as enum (
      'current_owner',
      'former_owner',
      'restorer',
      'storyteller',
      'contributor',
      'other'
    );
  end if;
end $$;

-- Extend car_owners without breaking existing access model
alter table public.car_owners
  add column if not exists relationship_type public.car_relationship_type,
  add column if not exists relationship_note text,
  add column if not exists relationship_start_year int,
  add column if not exists relationship_end_year int,
  add column if not exists relationship_is_public boolean not null default true,
  add column if not exists relationship_is_verified boolean not null default false;

-- Backfill existing owners
update public.car_owners
set relationship_type = 'current_owner'
where relationship_type is null and role = 'owner';

-- Constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'car_owners_relationship_note_len_chk') then
    alter table public.car_owners
      add constraint car_owners_relationship_note_len_chk
      check (relationship_note is null or char_length(trim(relationship_note)) <= 300);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_owners_relationship_years_chk') then
    alter table public.car_owners
      add constraint car_owners_relationship_years_chk
      check (
        (relationship_start_year is null or relationship_start_year between 1900 and 2100)
        and (relationship_end_year is null or relationship_end_year between 1900 and 2100)
        and (
          relationship_start_year is null
          or relationship_end_year is null
          or relationship_start_year <= relationship_end_year
        )
      );
  end if;
end $$;