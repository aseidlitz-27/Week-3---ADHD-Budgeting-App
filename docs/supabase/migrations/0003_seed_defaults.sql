-- 0003_seed_defaults.sql
-- When a new user signs up, automatically create their profile, their settings
-- row, and a starter set of spending categories. Runs as the database owner
-- (security definer) so it can insert rows despite Row Level Security.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  insert into public.settings (user_id) values (new.id);

  insert into public.categories (user_id, name, color, is_default) values
    (new.id, 'Groceries',     '#2e7d32', true),
    (new.id, 'Dining',        '#b26a00', true),
    (new.id, 'Transport',     '#1565c0', true),
    (new.id, 'Bills',         '#5e548e', true),
    (new.id, 'Shopping',      '#00695f', true),
    (new.id, 'Health',        '#c62828', true),
    (new.id, 'Entertainment', '#6a1b9a', true),
    (new.id, 'Other',         '#607d8b', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
