-- Micro Feed Database Initialization Script
-- Run this in your Supabase SQL Editor

-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- Create posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create likes table
create table if not exists likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;

-- Profiles policies
create policy "read profiles" on profiles for select using (true);
create policy "upsert self profile" on profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

-- Posts policies
create policy "read posts" on posts for select using (true);
create policy "insert own posts" on posts for insert with check (auth.uid() = author_id);
create policy "update own posts" on posts for update using (auth.uid() = author_id);
create policy "delete own posts" on posts for delete using (auth.uid() = author_id);

-- Likes policies
create policy "read likes" on likes for select using (true);
create policy "like" on likes for insert with check (auth.uid() = user_id);
create policy "unlike" on likes for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_likes_post_id on likes(post_id);
create index if not exists idx_likes_user_id on likes(user_id);

-- Insert some sample data (optional)
-- insert into profiles (id, username) values 
--   ('00000000-0000-0000-0000-000000000001', 'demo_user_1'),
--   ('00000000-0000-0000-0000-000000000002', 'demo_user_2');

-- insert into posts (author_id, content) values
--   ('00000000-0000-0000-0000-000000000001', 'Welcome to Micro Feed! This is a sample post.'),
--   ('00000000-0000-0000-0000-000000000002', 'Another sample post to get you started.');
