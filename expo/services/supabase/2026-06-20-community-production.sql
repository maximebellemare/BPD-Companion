create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists avatar_color text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null,
  author_username text,
  author_avatar_color text,
  is_anonymous boolean not null default false,
  title text not null,
  body text not null,
  category text not null,
  situation_tag text,
  has_content_warning boolean not null default false,
  content_warning_text text,
  emotions text[],
  support_type text,
  emotional_context jsonb,
  suggested_tool_id text,
  suggested_tool_name text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null,
  author_username text,
  author_avatar_color text,
  is_anonymous boolean not null default false,
  body text not null,
  label text,
  response_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists public.community_reply_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reply_id uuid not null references public.community_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (reply_id, user_id, reaction_type)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_id text not null,
  target_type text not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id)
);

create table if not exists public.community_circles (
  id text primary key,
  name text not null,
  description text not null,
  emoji text not null,
  color text not null,
  tags text[] not null default '{}',
  recent_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null references public.community_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

create table if not exists public.community_circle_posts (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null references public.community_circles(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null,
  author_username text,
  author_avatar_color text,
  is_anonymous boolean not null default false,
  title text not null,
  body text not null,
  type text not null default 'update',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_circle_replies (
  id uuid primary key default gen_random_uuid(),
  circle_post_id uuid not null references public.community_circle_posts(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null,
  author_username text,
  author_avatar_color text,
  is_anonymous boolean not null default false,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_circle_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_circle_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists public.community_circle_reply_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_circle_posts(id) on delete cascade,
  reply_id uuid not null references public.community_circle_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (reply_id, user_id, reaction_type)
);

create table if not exists public.community_private_conversations (
  id text primary key,
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references auth.users(id) on delete cascade,
  user_one_display_name text not null,
  user_one_username text,
  user_one_avatar_color text,
  user_two_display_name text not null,
  user_two_username text,
  user_two_avatar_color text,
  reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_one_id <> user_two_id)
);

create table if not exists public.community_private_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.community_private_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  body text not null,
  reported boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_private_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null references public.community_private_conversations(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts
for each row execute function public.set_updated_at();

drop trigger if exists community_replies_set_updated_at on public.community_replies;
create trigger community_replies_set_updated_at before update on public.community_replies
for each row execute function public.set_updated_at();

drop trigger if exists community_circles_set_updated_at on public.community_circles;
create trigger community_circles_set_updated_at before update on public.community_circles
for each row execute function public.set_updated_at();

drop trigger if exists community_circle_posts_set_updated_at on public.community_circle_posts;
create trigger community_circle_posts_set_updated_at before update on public.community_circle_posts
for each row execute function public.set_updated_at();

drop trigger if exists community_circle_replies_set_updated_at on public.community_circle_replies;
create trigger community_circle_replies_set_updated_at before update on public.community_circle_replies
for each row execute function public.set_updated_at();

drop trigger if exists community_private_conversations_set_updated_at on public.community_private_conversations;
create trigger community_private_conversations_set_updated_at before update on public.community_private_conversations
for each row execute function public.set_updated_at();

insert into public.community_circles (id, name, description, emoji, color, tags)
values
  ('circle-relationship', 'Relationship Triggers', 'A safe space to discuss relationship challenges, attachment patterns, and communication struggles.', '💛', '#67E8F9', array['relationships', 'attachment', 'communication']),
  ('circle-shame', 'Shame Recovery', 'Supporting each other through shame spirals and building self-compassion together.', '🌿', '#14B8A6', array['shame', 'self-compassion', 'recovery']),
  ('circle-regulation', 'Emotion Regulation Practice', 'Share experiences with DBT skills, coping strategies, and emotional regulation techniques.', '🧘', '#2E2A72', array['dbt', 'coping', 'regulation']),
  ('circle-identity', 'Identity & Self', 'Exploring identity, sense of self, and finding who you are beyond the diagnosis.', '🪞', '#3B82F6', array['identity', 'self-discovery', 'growth']),
  ('circle-daily', 'Daily Check-Ins', 'A gentle space for daily emotional check-ins. No pressure, just presence.', '🌅', '#67E8F9', array['daily', 'check-in', 'routine'])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji,
  color = excluded.color,
  tags = excluded.tags,
  updated_at = now();

alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_post_reactions enable row level security;
alter table public.community_reply_reactions enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_blocked_users enable row level security;
alter table public.community_circles enable row level security;
alter table public.community_circle_members enable row level security;
alter table public.community_circle_posts enable row level security;
alter table public.community_circle_replies enable row level security;
alter table public.community_circle_post_reactions enable row level security;
alter table public.community_circle_reply_reactions enable row level security;
alter table public.community_private_conversations enable row level security;
alter table public.community_private_messages enable row level security;
alter table public.community_private_reports enable row level security;

drop policy if exists "Community posts are readable" on public.community_posts;
create policy "Community posts are readable" on public.community_posts for select to authenticated using (true);
drop policy if exists "Users create own community posts" on public.community_posts;
create policy "Users create own community posts" on public.community_posts for insert to authenticated with check (author_user_id = auth.uid());
drop policy if exists "Users update own community posts" on public.community_posts;
create policy "Users update own community posts" on public.community_posts for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
drop policy if exists "Users delete own community posts" on public.community_posts;
create policy "Users delete own community posts" on public.community_posts for delete to authenticated using (author_user_id = auth.uid());

drop policy if exists "Community replies are readable" on public.community_replies;
create policy "Community replies are readable" on public.community_replies for select to authenticated using (true);
drop policy if exists "Users create own community replies" on public.community_replies;
create policy "Users create own community replies" on public.community_replies for insert to authenticated with check (author_user_id = auth.uid());
drop policy if exists "Users update own community replies" on public.community_replies;
create policy "Users update own community replies" on public.community_replies for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
drop policy if exists "Users delete own community replies" on public.community_replies;
create policy "Users delete own community replies" on public.community_replies for delete to authenticated using (author_user_id = auth.uid());

drop policy if exists "Community post reactions are readable" on public.community_post_reactions;
create policy "Community post reactions are readable" on public.community_post_reactions for select to authenticated using (true);
drop policy if exists "Users manage own community post reactions" on public.community_post_reactions;
create policy "Users manage own community post reactions" on public.community_post_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Community reply reactions are readable" on public.community_reply_reactions;
create policy "Community reply reactions are readable" on public.community_reply_reactions for select to authenticated using (true);
drop policy if exists "Users manage own community reply reactions" on public.community_reply_reactions;
create policy "Users manage own community reply reactions" on public.community_reply_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users create community reports" on public.community_reports;
create policy "Users create community reports" on public.community_reports for insert to authenticated with check (reporter_user_id = auth.uid());
drop policy if exists "Users read own community reports" on public.community_reports;
create policy "Users read own community reports" on public.community_reports for select to authenticated using (reporter_user_id = auth.uid());

drop policy if exists "Users manage own community blocks" on public.community_blocked_users;
create policy "Users manage own community blocks" on public.community_blocked_users for all to authenticated using (blocker_user_id = auth.uid()) with check (blocker_user_id = auth.uid());

drop policy if exists "Community circles are readable" on public.community_circles;
create policy "Community circles are readable" on public.community_circles for select to authenticated using (true);

drop policy if exists "Circle memberships are readable" on public.community_circle_members;
create policy "Circle memberships are readable" on public.community_circle_members for select to authenticated using (true);
drop policy if exists "Users manage own circle memberships" on public.community_circle_members;
create policy "Users manage own circle memberships" on public.community_circle_members for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Circle posts are readable" on public.community_circle_posts;
create policy "Circle posts are readable" on public.community_circle_posts for select to authenticated using (true);
drop policy if exists "Users create own circle posts" on public.community_circle_posts;
create policy "Users create own circle posts" on public.community_circle_posts for insert to authenticated with check (author_user_id = auth.uid());
drop policy if exists "Users update own circle posts" on public.community_circle_posts;
create policy "Users update own circle posts" on public.community_circle_posts for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
drop policy if exists "Users delete own circle posts" on public.community_circle_posts;
create policy "Users delete own circle posts" on public.community_circle_posts for delete to authenticated using (author_user_id = auth.uid());

drop policy if exists "Circle replies are readable" on public.community_circle_replies;
create policy "Circle replies are readable" on public.community_circle_replies for select to authenticated using (true);
drop policy if exists "Users create own circle replies" on public.community_circle_replies;
create policy "Users create own circle replies" on public.community_circle_replies for insert to authenticated with check (author_user_id = auth.uid());
drop policy if exists "Users update own circle replies" on public.community_circle_replies;
create policy "Users update own circle replies" on public.community_circle_replies for update to authenticated using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
drop policy if exists "Users delete own circle replies" on public.community_circle_replies;
create policy "Users delete own circle replies" on public.community_circle_replies for delete to authenticated using (author_user_id = auth.uid());

drop policy if exists "Circle post reactions are readable" on public.community_circle_post_reactions;
create policy "Circle post reactions are readable" on public.community_circle_post_reactions for select to authenticated using (true);
drop policy if exists "Users manage own circle post reactions" on public.community_circle_post_reactions;
create policy "Users manage own circle post reactions" on public.community_circle_post_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Circle reply reactions are readable" on public.community_circle_reply_reactions;
create policy "Circle reply reactions are readable" on public.community_circle_reply_reactions for select to authenticated using (true);
drop policy if exists "Users manage own circle reply reactions" on public.community_circle_reply_reactions;
create policy "Users manage own circle reply reactions" on public.community_circle_reply_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users read own private conversations" on public.community_private_conversations;
create policy "Users read own private conversations" on public.community_private_conversations for select to authenticated using (auth.uid() in (user_one_id, user_two_id));
drop policy if exists "Users create own private conversations" on public.community_private_conversations;
create policy "Users create own private conversations" on public.community_private_conversations for insert to authenticated with check (auth.uid() in (user_one_id, user_two_id));
drop policy if exists "Users update own private conversations" on public.community_private_conversations;
create policy "Users update own private conversations" on public.community_private_conversations for update to authenticated using (auth.uid() in (user_one_id, user_two_id)) with check (auth.uid() in (user_one_id, user_two_id));

drop policy if exists "Users read messages in own private conversations" on public.community_private_messages;
create policy "Users read messages in own private conversations" on public.community_private_messages for select to authenticated using (
  exists (
    select 1 from public.community_private_conversations c
    where c.id = conversation_id and auth.uid() in (c.user_one_id, c.user_two_id)
  )
);
drop policy if exists "Users send messages in own private conversations" on public.community_private_messages;
create policy "Users send messages in own private conversations" on public.community_private_messages for insert to authenticated with check (
  sender_user_id = auth.uid()
  and exists (
    select 1 from public.community_private_conversations c
    where c.id = conversation_id and auth.uid() in (c.user_one_id, c.user_two_id)
  )
);

drop policy if exists "Users create private message reports" on public.community_private_reports;
create policy "Users create private message reports" on public.community_private_reports for insert to authenticated with check (reporter_user_id = auth.uid());
drop policy if exists "Users read own private message reports" on public.community_private_reports;
create policy "Users read own private message reports" on public.community_private_reports for select to authenticated using (reporter_user_id = auth.uid());
