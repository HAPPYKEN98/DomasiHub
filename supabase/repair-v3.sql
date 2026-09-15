-- DOMASI HUB 2.0 — LISTINGS / PUBLIC PROFILE REPAIR
-- Run AFTER schema.sql and repair-v2.sql.
-- Safe to run more than once.

-- Ensure every listing/resource type can hold up to three public image URLs.
alter table public.listings add column if not exists image_urls text[] not null default '{}';
alter table public.housing add column if not exists image_urls text[] not null default '{}';
alter table public.academic_resources add column if not exists image_urls text[] not null default '{}';
alter table public.skill_services add column if not exists image_urls text[] not null default '{}';
alter table public.printing_providers add column if not exists image_urls text[] not null default '{}';

-- Keep the safe public profile projection, but make it readable to anonymous users.
-- Only non-sensitive profile fields are exposed.
drop view if exists public.public_profiles;
create view public.public_profiles as
select id, full_name, avatar_url, verified
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Make ownership edits/deletes explicit for all four main listing sections.
drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings
for delete to authenticated using (posted_by = auth.uid());

drop policy if exists "housing_update_own" on public.housing;
create policy "housing_update_own" on public.housing
for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
drop policy if exists "housing_delete_own" on public.housing;
create policy "housing_delete_own" on public.housing
for delete to authenticated using (posted_by = auth.uid());

drop policy if exists "academic_update_own" on public.academic_resources;
create policy "academic_update_own" on public.academic_resources
for update to authenticated using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());
drop policy if exists "academic_delete_own" on public.academic_resources;
create policy "academic_delete_own" on public.academic_resources
for delete to authenticated using (uploaded_by = auth.uid());

drop policy if exists "print_providers_update_own" on public.printing_providers;
create policy "print_providers_update_own" on public.printing_providers
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "print_providers_delete_own" on public.printing_providers;
create policy "print_providers_delete_own" on public.printing_providers
for delete to authenticated using (owner_id = auth.uid());
