-- TypeRush Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stats table for tracking user typing performance
create table public.stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade unique not null,
  avg_wpm numeric default 0,
  best_wpm numeric default 0,
  total_races integer default 0,
  wins integer default 0,
  accuracy numeric default 0
);

-- Matches table for 1v1 race history
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  player1_id uuid references public.profiles not null,
  player2_id uuid references public.profiles not null,
  winner_id uuid references public.profiles,
  player1_wpm numeric not null,
  player2_wpm numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lobbies table for matchmaking
create table public.lobbies (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles not null,
  guest_id uuid references public.profiles,
  room_code text unique not null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  text_to_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.stats enable row level security;
alter table public.matches enable row level security;
alter table public.lobbies enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Stats policies
create policy "Stats are viewable by everyone"
  on public.stats for select
  using (true);

create policy "Users can update their own stats"
  on public.stats for update
  using (auth.uid() = user_id);

create policy "Users can insert their own stats"
  on public.stats for insert
  with check (auth.uid() = user_id);

-- Matches policies
create policy "Matches are viewable by everyone"
  on public.matches for select
  using (true);

create policy "Players can insert matches they're part of"
  on public.matches for insert
  with check (auth.uid() = player1_id or auth.uid() = player2_id);

-- Lobbies policies
create policy "Lobbies are viewable by everyone"
  on public.lobbies for select
  using (true);

create policy "Authenticated users can create lobbies"
  on public.lobbies for insert
  with check (auth.uid() = host_id);

create policy "Host can update their lobby"
  on public.lobbies for update
  using (auth.uid() = host_id or auth.uid() = guest_id);

create policy "Host can delete their lobby"
  on public.lobbies for delete
  using (auth.uid() = host_id);

-- Function to create profile and stats on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Player_' || substr(new.id::text, 1, 8)));
  
  insert into public.stats (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for lobbies
alter publication supabase_realtime add table public.lobbies;
