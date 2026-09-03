-- Domasi Hub 2.0
-- Apply in Supabase Dashboard → SQL Editor (run the whole file).
-- This replaces the legacy integer-id / password-hash tables with Auth UUIDs + RLS.
-- Back up any data you still need before running.

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

drop table if exists public.print_jobs cascade;
drop table if exists public.printing_providers cascade;
drop table if exists public.notifications cascade;
drop table if exists public.bulletins cascade;
drop table if exists public.academic_resources cascade;
drop table if exists public.skill_services cascade;
drop table if exists public.housing cascade;
drop table if exists public.listings cascade;
drop table if exists public.campus_landmarks cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  reg_number text,
  whatsapp_number text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_reg_number_key
  on public.profiles (reg_number)
  where reg_number is not null and length(reg_number) > 0;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null,
  price numeric(12, 2),
  contact_number text not null,
  item_condition text,
  location_details text,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  created_at timestamptz not null default now()
);

create index listings_created_at_idx on public.listings (created_at desc);
create index listings_status_idx on public.listings (status);

create table public.housing (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  location_details text not null,
  rent numeric(12, 2),
  utilities text,
  security_notes text,
  contact_number text not null,
  description text,
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create index housing_created_at_idx on public.housing (created_at desc);

create table public.academic_resources (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  department text not null,
  academic_year text,
  course_code text,
  file_url text not null,
  file_name text,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index academic_resources_created_at_idx on public.academic_resources (created_at desc);

create table public.skill_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  provider_name text not null,
  skill_category text not null,
  service_title text not null,
  description text,
  starting_price numeric(12, 2) default 0,
  contact_number text not null,
  created_at timestamptz not null default now()
);

create index skill_services_created_at_idx on public.skill_services (created_at desc);

create table public.printing_providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  location_details text,
  contact_number text not null,
  notes text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.printing_providers (id) on delete cascade,
  copies integer not null default 1 check (copies > 0),
  notes text,
  file_url text,
  file_name text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create index print_jobs_submitted_by_idx on public.print_jobs (submitted_by, created_at desc);

create table public.bulletins (
  id uuid primary key default gen_random_uuid(),
  notice_type text not null default 'general',
  title text not null,
  description text not null,
  posted_by uuid references public.profiles (id) on delete set null,
  event_date date,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg text;
begin
  v_reg := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'reg_number', ''), '\s+', '', 'g'));
  if v_reg = '' then
    v_reg := null;
  end if;

  insert into public.profiles (id, full_name, reg_number, whatsapp_number)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    v_reg,
    nullif(trim(new.raw_user_meta_data->>'whatsapp_number'), '')
  );

  insert into public.notifications (user_id, title, body, link)
  values (
    new.id,
    'Welcome to Domasi Hub',
    'Your campus network is ready. Explore marketplace, housing, notes, printing and student services.',
    'home.html'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.housing enable row level security;
alter table public.academic_resources enable row level security;
alter table public.skill_services enable row level security;
alter table public.printing_providers enable row level security;
alter table public.print_jobs enable row level security;
alter table public.bulletins enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select" on public.profiles for select to anon, authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "listings_select" on public.listings for select to anon, authenticated using (status = 'active' or posted_by = auth.uid());
create policy "listings_insert_own" on public.listings for insert to authenticated with check (posted_by = auth.uid());
create policy "listings_update_own" on public.listings for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
create policy "listings_delete_own" on public.listings for delete to authenticated using (posted_by = auth.uid());

create policy "housing_select" on public.housing for select to anon, authenticated using (true);
create policy "housing_insert_own" on public.housing for insert to authenticated with check (posted_by = auth.uid());
create policy "housing_update_own" on public.housing for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
create policy "housing_delete_own" on public.housing for delete to authenticated using (posted_by = auth.uid());

create policy "academic_select" on public.academic_resources for select to anon, authenticated using (true);
create policy "academic_insert_own" on public.academic_resources for insert to authenticated with check (uploaded_by = auth.uid());
create policy "academic_delete_own" on public.academic_resources for delete to authenticated using (uploaded_by = auth.uid());

create policy "services_select" on public.skill_services for select to anon, authenticated using (true);
create policy "services_insert_own" on public.skill_services for insert to authenticated with check (provider_id = auth.uid());
create policy "services_update_own" on public.skill_services for update to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy "services_delete_own" on public.skill_services for delete to authenticated using (provider_id = auth.uid());

create policy "print_providers_select" on public.printing_providers for select to anon, authenticated using (true);
create policy "print_providers_insert_own" on public.printing_providers for insert to authenticated with check (owner_id = auth.uid());
create policy "print_providers_update_own" on public.printing_providers for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "print_jobs_select_own" on public.print_jobs for select to authenticated
  using (
    submitted_by = auth.uid()
    or exists (
      select 1 from public.printing_providers p
      where p.id = print_jobs.provider_id and p.owner_id = auth.uid()
    )
  );
create policy "print_jobs_insert_own" on public.print_jobs for insert to authenticated with check (submitted_by = auth.uid());
create policy "print_jobs_update_involved" on public.print_jobs for update to authenticated
  using (
    submitted_by = auth.uid()
    or exists (
      select 1 from public.printing_providers p
      where p.id = print_jobs.provider_id and p.owner_id = auth.uid()
    )
  );

create policy "bulletins_select" on public.bulletins for select to anon, authenticated using (true);
create policy "bulletins_insert_auth" on public.bulletins for insert to authenticated with check (posted_by = auth.uid());

create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('hub-public', 'hub-public', true, 15728640),
  ('hub-private', 'hub-private', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "hub_public_read" on storage.objects;
drop policy if exists "hub_public_write" on storage.objects;
drop policy if exists "hub_public_update_own" on storage.objects;
drop policy if exists "hub_private_read" on storage.objects;
drop policy if exists "hub_private_write" on storage.objects;

create policy "hub_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'hub-public');

create policy "hub_public_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'hub-public' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "hub_public_update_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'hub-public' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "hub_private_read"
on storage.objects for select
to authenticated
using (bucket_id = 'hub-private' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "hub_private_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'hub-private' and (storage.foldername(name))[1] = auth.uid()::text);




-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL DEFAULT ''::text,
  reg_number text,
  whatsapp_number text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'admin'::text])),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  price numeric,
  contact_number text NOT NULL,
  item_condition text,
  location_details text,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'sold'::text, 'hidden'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.housing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL,
  title text NOT NULL,
  location_details text NOT NULL,
  rent numeric,
  utilities text,
  security_notes text,
  contact_number text NOT NULL,
  description text,
  image_url text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT housing_pkey PRIMARY KEY (id),
  CONSTRAINT housing_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.academic_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  department text NOT NULL,
  academic_year text,
  course_code text,
  file_url text NOT NULL,
  file_name text,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_resources_pkey PRIMARY KEY (id),
  CONSTRAINT academic_resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.skill_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  provider_name text NOT NULL,
  skill_category text NOT NULL,
  service_title text NOT NULL,
  description text,
  starting_price numeric DEFAULT 0,
  contact_number text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT skill_services_pkey PRIMARY KEY (id),
  CONSTRAINT skill_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.printing_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  location_details text,
  contact_number text NOT NULL,
  notes text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT printing_providers_pkey PRIMARY KEY (id),
  CONSTRAINT printing_providers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.print_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  provider_id uuid NOT NULL,
  copies integer NOT NULL DEFAULT 1 CHECK (copies > 0),
  notes text,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'ready'::text, 'done'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT print_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT print_jobs_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id),
  CONSTRAINT print_jobs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.printing_providers(id)
);
CREATE TABLE public.bulletins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notice_type text NOT NULL DEFAULT 'general'::text,
  title text NOT NULL,
  description text NOT NULL,
  posted_by uuid,
  event_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bulletins_pkey PRIMARY KEY (id),
  CONSTRAINT bulletins_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);