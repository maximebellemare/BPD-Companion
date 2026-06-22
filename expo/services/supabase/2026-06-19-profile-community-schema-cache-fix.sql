alter table public.profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists avatar_color text;

alter table public.profiles
  drop constraint if exists profiles_username_format_check,
  add constraint profiles_username_format_check
    check (username is null or username ~ '^[a-z0-9_]{3,20}$');

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_avatar_color_format_check,
  add constraint profiles_avatar_color_format_check
    check (
      avatar_color is null
      or avatar_color ~ '^#[0-9A-Fa-f]{6}$'
    );

notify pgrst, 'reload schema';
