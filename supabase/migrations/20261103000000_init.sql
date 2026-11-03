-- Fix or Shop: initial schema
-- Every table is owned by a user and protected by row-level security.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vin text,
  year int not null check (year between 1950 and 2100),
  make text not null,
  model text not null,
  trim text,
  engine text,
  nickname text,
  mileage int check (mileage >= 0),
  created_at timestamptz not null default now()
);

create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  symptom text not null,
  context jsonb not null default '{}'::jsonb,      -- guided answers: when, warning lights, noise...
  photo_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  result jsonb,                                    -- causes, verdicts, costs (written by the diagnose function)
  recalls jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

-- Step-by-step guide for one DIY cause of a diagnosis, generated on demand and cached.
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  diagnosis_id uuid not null references public.diagnoses (id) on delete cascade,
  cause_index int not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (diagnosis_id, cause_index)
);

create table public.repairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  diagnosis_id uuid references public.diagnoses (id) on delete set null,
  cause_index int,
  title text not null,
  path text not null check (path in ('diy', 'shop')),
  status text not null default 'in_progress' check (status in ('in_progress', 'fixed', 'not_fixed')),
  steps_done int[] not null default '{}',
  amount_spent numeric(10, 2) check (amount_spent >= 0),
  shop_estimate_low numeric(10, 2),
  shop_estimate_high numeric(10, 2),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.vehicles (user_id);
create index on public.diagnoses (user_id, created_at desc);
create index on public.diagnoses (vehicle_id);
create index on public.repairs (user_id, created_at desc);
create index on public.repairs (vehicle_id);

alter table public.vehicles enable row level security;
alter table public.diagnoses enable row level security;
alter table public.guides enable row level security;
alter table public.repairs enable row level security;

-- Vehicles and repairs: users fully manage their own rows.
create policy "own vehicles" on public.vehicles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own repairs" on public.repairs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = (select auth.uid()))
  );

-- Diagnoses and guides: users can read and delete their own. Only the Edge Functions
-- (service role, which bypasses RLS) write them, so AI results cannot be forged by a client.
create policy "read own diagnoses" on public.diagnoses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "delete own diagnoses" on public.diagnoses
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "read own guides" on public.guides
  for select to authenticated using ((select auth.uid()) = user_id);

-- Private bucket for symptom photos. Path convention: <user id>/<random>.<ext>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('symptom-photos', 'symptom-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "read own photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
