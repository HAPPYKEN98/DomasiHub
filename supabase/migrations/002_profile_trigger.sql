-- Creates the public profile automatically whenever Supabase Auth creates a user.
-- This also works when email confirmation is enabled.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, reg_number, whatsapp_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    coalesce(new.raw_user_meta_data->>'reg_number', new.email),
    new.raw_user_meta_data->>'whatsapp_number'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    reg_number = excluded.reg_number,
    whatsapp_number = excluded.whatsapp_number;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
