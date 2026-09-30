-- Apply with Supabase migrations or the SQL editor before enabling the client.
create extension if not exists pgcrypto;

create table if not exists public.food_experience_reviews (
  id uuid primary key default gen_random_uuid(),
  food_id text not null check (food_id in ('tteokbokki', 'pho', 'pad-thai', 'nasi-goreng', 'langos')),
  culture text not null check (culture in ('korean', 'vietnamese', 'thai', 'indonesian', 'hungarian')),
  reminded_of text not null default '' check (char_length(reminded_of) <= 160),
  cultural_description text not null default '' check (char_length(cultural_description) <= 240),
  familiarity_score smallint not null check (familiarity_score between 0 and 10),
  liking_score smallint not null check (liking_score between 0 and 10),
  matmi_accuracy_score smallint not null check (matmi_accuracy_score between 0 and 10),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint meaningful_experience check (
    char_length(btrim(reminded_of || cultural_description)) >= 3
    and char_length(regexp_replace(reminded_of || cultural_description, '[^[:alpha:]]', '', 'g')) >= 3
    and lower(btrim(reminded_of || cultural_description)) not in ('asdf', 'qwer', 'test', 'abc', 'n/a')
  )
);

create index if not exists food_experience_reviews_lookup
  on public.food_experience_reviews (food_id, culture, created_at desc);

alter table public.food_experience_reviews enable row level security;
revoke all on table public.food_experience_reviews from public, anon, authenticated;
grant select, insert on table public.food_experience_reviews to anon;

create policy "Anyone can read anonymous experiences"
  on public.food_experience_reviews for select to anon using (true);
create policy "Anonymous visitors can submit genuine experiences"
  on public.food_experience_reviews for insert to anon with check (is_demo = false);

-- There are intentionally no UPDATE or DELETE grants or policies for anonymous visitors.
-- Service-role/admin SQL operations remain server-side only; never ship that key in the app.
