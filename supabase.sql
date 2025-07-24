
create table public.users (
  id bigserial primary key,
  telegram_id bigint unique not null,
  dtx_balance numeric default 0,
  miner_level int default 1,
  referral_count int default 0,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "User can read/write own row"
on public.users for all
using (telegram_id::text = auth.jwt()->> 'telegram_id');
