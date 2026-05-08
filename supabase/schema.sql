create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.bookme_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  name text,
  image text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookme_hotels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  hotel_name text not null,
  city text not null default '',
  checkin_window text not null default '',
  escalation_contact text not null default '',
  gstin text not null default '',
  source_system text not null default '',
  room_types jsonb not null default '[]'::jsonb,
  total_rooms integer not null default 0,
  photo_name text,
  proposal jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookme_hotels_slug_not_blank check (length(btrim(slug)) > 0),
  constraint bookme_hotels_room_types_array check (jsonb_typeof(room_types) = 'array'),
  constraint bookme_hotels_proposal_object check (proposal is null or jsonb_typeof(proposal) = 'object')
);

create table if not exists public.bookme_audit_events (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text,
  actor_type text not null default 'system',
  actor_id text,
  event_type text not null,
  workflow text,
  tool_name text,
  booking_id text,
  status text not null default 'ok',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint bookme_audit_events_event_type_not_blank check (length(btrim(event_type)) > 0),
  constraint bookme_audit_events_status_not_blank check (length(btrim(status)) > 0),
  constraint bookme_audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists bookme_hotels_created_at_idx on public.bookme_hotels (created_at desc);
create index if not exists bookme_users_created_at_idx on public.bookme_users (created_at desc);
create index if not exists bookme_audit_events_hotel_created_at_idx on public.bookme_audit_events (hotel_slug, created_at desc);
create index if not exists bookme_audit_events_booking_id_idx on public.bookme_audit_events (booking_id);
create index if not exists bookme_audit_events_event_type_idx on public.bookme_audit_events (event_type);

create or replace function public.set_bookme_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bookme_users_updated_at on public.bookme_users;
create trigger set_bookme_users_updated_at
before update on public.bookme_users
for each row
execute function public.set_bookme_updated_at();

drop trigger if exists set_bookme_hotels_updated_at on public.bookme_hotels;
create trigger set_bookme_hotels_updated_at
before update on public.bookme_hotels
for each row
execute function public.set_bookme_updated_at();

alter table public.bookme_users enable row level security;
alter table public.bookme_hotels enable row level security;
alter table public.bookme_audit_events enable row level security;
