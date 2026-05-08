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

create table if not exists public.bookme_hotel_memberships (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text not null,
  user_email citext not null,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookme_hotel_memberships_role_check check (role in ('owner', 'admin', 'staff')),
  constraint bookme_hotel_memberships_hotel_slug_not_blank check (length(btrim(hotel_slug)) > 0),
  constraint bookme_hotel_memberships_user_email_not_blank check (length(btrim(user_email::text)) > 0),
  constraint bookme_hotel_memberships_unique unique (hotel_slug, user_email)
);

create table if not exists public.bookme_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text not null default 'sriram-hotel',
  room_id text not null,
  room_type text not null,
  label text not null,
  price_per_night integer not null default 0,
  floor integer not null default 0,
  view text not null default '',
  max_guests integer not null default 2,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookme_rooms_room_type_check check (room_type in ('queen', 'king', 'suite')),
  constraint bookme_rooms_room_id_not_blank check (length(btrim(room_id)) > 0),
  constraint bookme_rooms_unique unique (hotel_slug, room_id)
);

create table if not exists public.bookme_reservations (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text not null default 'sriram-hotel',
  booking_id text not null,
  idempotency_key text,
  guest_name text not null,
  phone text not null default '',
  email citext not null default '',
  room_id text not null,
  checkin date not null,
  checkout date not null,
  status text not null,
  created_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  payment_status text not null default 'pending',
  payment_mode text not null default 'pay_at_property',
  payment_provider text not null default 'manual',
  payment_reference text,
  pay_at_property boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint bookme_reservations_status_check check (status in ('Confirmed', 'Checked In', 'Checked Out')),
  constraint bookme_reservations_dates_check check (checkout > checkin),
  constraint bookme_reservations_booking_id_not_blank check (length(btrim(booking_id)) > 0),
  constraint bookme_reservations_unique_booking unique (hotel_slug, booking_id),
  constraint bookme_reservations_unique_idempotency unique (hotel_slug, idempotency_key)
);

create index if not exists bookme_hotels_created_at_idx on public.bookme_hotels (created_at desc);
create index if not exists bookme_users_created_at_idx on public.bookme_users (created_at desc);
create index if not exists bookme_audit_events_hotel_created_at_idx on public.bookme_audit_events (hotel_slug, created_at desc);
create index if not exists bookme_audit_events_booking_id_idx on public.bookme_audit_events (booking_id);
create index if not exists bookme_audit_events_event_type_idx on public.bookme_audit_events (event_type);
create index if not exists bookme_hotel_memberships_user_email_idx on public.bookme_hotel_memberships (user_email);
create index if not exists bookme_hotel_memberships_hotel_slug_idx on public.bookme_hotel_memberships (hotel_slug);
create index if not exists bookme_rooms_hotel_active_idx on public.bookme_rooms (hotel_slug, is_active);
create index if not exists bookme_reservations_hotel_status_idx on public.bookme_reservations (hotel_slug, status);
create index if not exists bookme_reservations_room_dates_idx on public.bookme_reservations (hotel_slug, room_id, checkin, checkout);

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

drop trigger if exists set_bookme_hotel_memberships_updated_at on public.bookme_hotel_memberships;
create trigger set_bookme_hotel_memberships_updated_at
before update on public.bookme_hotel_memberships
for each row
execute function public.set_bookme_updated_at();

drop trigger if exists set_bookme_rooms_updated_at on public.bookme_rooms;
create trigger set_bookme_rooms_updated_at
before update on public.bookme_rooms
for each row
execute function public.set_bookme_updated_at();

drop trigger if exists set_bookme_reservations_updated_at on public.bookme_reservations;
create trigger set_bookme_reservations_updated_at
before update on public.bookme_reservations
for each row
execute function public.set_bookme_updated_at();

alter table public.bookme_users enable row level security;
alter table public.bookme_hotels enable row level security;
alter table public.bookme_audit_events enable row level security;
alter table public.bookme_hotel_memberships enable row level security;
alter table public.bookme_rooms enable row level security;
alter table public.bookme_reservations enable row level security;
