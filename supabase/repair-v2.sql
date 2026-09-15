-- ============================================================
-- DOMASI HUB 2.0 — FOUNDATION REPAIR
-- Run this AFTER the original schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. MULTI-IMAGE SUPPORT
-- ------------------------------------------------------------

alter table public.listings
  add column if not exists image_urls text[] not null default '{}';

alter table public.housing
  add column if not exists image_urls text[] not null default '{}';

alter table public.academic_resources
  add column if not exists image_urls text[] not null default '{}';

alter table public.skill_services
  add column if not exists image_urls text[] not null default '{}';

alter table public.printing_providers
  add column if not exists image_urls text[] not null default '{}';


-- ------------------------------------------------------------
-- 2. MIGRATE OLD SINGLE IMAGE VALUES
-- ------------------------------------------------------------

update public.listings
set image_urls = array[image_url]
where image_url is not null
  and trim(image_url) <> ''
  and cardinality(image_urls) = 0;

update public.housing
set image_urls = array[image_url]
where image_url is not null
  and trim(image_url) <> ''
  and cardinality(image_urls) = 0;


-- ------------------------------------------------------------
-- 3. UPDATED_AT FOR EDITABLE CONTENT
-- ------------------------------------------------------------

alter table public.listings
  add column if not exists updated_at timestamptz not null default now();

alter table public.housing
  add column if not exists updated_at timestamptz not null default now();

alter table public.academic_resources
  add column if not exists updated_at timestamptz not null default now();

alter table public.skill_services
  add column if not exists updated_at timestamptz not null default now();

alter table public.printing_providers
  add column if not exists updated_at timestamptz not null default now();


-- ------------------------------------------------------------
-- 4. UPDATED_AT TRIGGER
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists listings_set_updated_at
on public.listings;

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();


drop trigger if exists housing_set_updated_at
on public.housing;

create trigger housing_set_updated_at
before update on public.housing
for each row execute function public.set_updated_at();


drop trigger if exists academics_set_updated_at
on public.academic_resources;

create trigger academics_set_updated_at
before update on public.academic_resources
for each row execute function public.set_updated_at();


drop trigger if exists services_set_updated_at
on public.skill_services;

create trigger services_set_updated_at
before update on public.skill_services
for each row execute function public.set_updated_at();


drop trigger if exists printing_set_updated_at
on public.printing_providers;

create trigger printing_set_updated_at
before update on public.printing_providers
for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 5. A SAFE PUBLIC PROFILE VIEW
--
-- NEVER expose reg_number / whatsapp_number publicly.
-- ------------------------------------------------------------

drop view if exists public.public_profiles;

create view public.public_profiles
with (security_invoker = true)
as
select
  id,
  full_name,
  avatar_url,
  verified
from public.profiles;


grant select on public.public_profiles
to anon, authenticated;


-- ------------------------------------------------------------
-- 6. REMOVE THE OLD PUBLIC PROFILE POLICY
-- ------------------------------------------------------------

drop policy if exists "profiles_select"
on public.profiles;


-- Users can still access their own complete profile.
drop policy if exists "profiles_select_own"
on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());


-- ------------------------------------------------------------
-- 7. ACADEMIC UPDATE
-- ------------------------------------------------------------

drop policy if exists "academic_update_own"
on public.academic_resources;

create policy "academic_update_own"
on public.academic_resources
for update
to authenticated
using (uploaded_by = auth.uid())
with check (uploaded_by = auth.uid());


-- ------------------------------------------------------------
-- 8. PRINTING DELETE
-- ------------------------------------------------------------

drop policy if exists "print_providers_delete_own"
on public.printing_providers;

create policy "print_providers_delete_own"
on public.printing_providers
for delete
to authenticated
using (owner_id = auth.uid());


-- ------------------------------------------------------------
-- 9. PRINT JOB DELETE
-- ------------------------------------------------------------

drop policy if exists "print_jobs_delete_involved"
on public.print_jobs;

create policy "print_jobs_delete_involved"
on public.print_jobs
for delete
to authenticated
using (
  submitted_by = auth.uid()
  or exists (
    select 1
    from public.printing_providers p
    where p.id = print_jobs.provider_id
      and p.owner_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- 10. PRIVATE DOCUMENT ACCESS
--
-- Academic documents use:
-- user-id/academic/filename
--
-- Owner can upload.
-- Authenticated students can read academic documents.
-- ------------------------------------------------------------

drop policy if exists "hub_private_read"
on storage.objects;

create policy "hub_private_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hub-private'
  and (storage.foldername(name))[2] = 'academic'
);


-- Owner can delete their own private academic files.
drop policy if exists "hub_private_delete_own"
on storage.objects;

create policy "hub_private_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'hub-private'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- ------------------------------------------------------------
-- 11. INDEXES
-- ------------------------------------------------------------

create index if not exists listings_updated_at_idx
on public.listings(updated_at desc);

create index if not exists housing_updated_at_idx
on public.housing(updated_at desc);

create index if not exists academic_resources_updated_at_idx
on public.academic_resources(updated_at desc);

create index if not exists skill_services_updated_at_idx
on public.skill_services(updated_at desc);

create index if not exists printing_providers_updated_at_idx
on public.printing_providers(updated_at desc);