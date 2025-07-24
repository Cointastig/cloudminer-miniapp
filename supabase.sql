-- Create users table with enhanced fields
create table public.users (
  id bigserial primary key,
  telegram_id bigint unique not null,
  dtx_balance numeric default 0 check (dtx_balance >= 0),
  miner_level int default 1 check (miner_level >= 1 and miner_level <= 100),
  referral_count int default 0 check (referral_count >= 0),
  total_mined numeric default 0 check (total_mined >= 0),
  mining_sessions int default 0 check (mining_sessions >= 0),
  last_claim_at timestamptz,
  last_active_at timestamptz default now(),
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for performance
create index idx_users_telegram_id on public.users(telegram_id);
create index idx_users_active_at on public.users(last_active_at);

-- Enable RLS
alter table public.users enable row level security;

-- Create policy for users to access their own data
create policy "Users can access own data"
on public.users for all
using (telegram_id::text = auth.jwt()->> 'telegram_id');

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function update_updated_at_column();

-- Create mining_history table for tracking mining sessions
create table public.mining_history (
  id bigserial primary key,
  user_id bigint references public.users(id) on delete cascade,
  telegram_id bigint not null,
  dtx_earned numeric not null check (dtx_earned >= 0),
  mining_duration int not null check (mining_duration >= 0), -- in seconds
  miner_level int not null check (miner_level >= 1),
  session_start timestamptz not null,
  session_end timestamptz not null,
  inserted_at timestamptz default now()
);

-- Enable RLS for mining_history
alter table public.mining_history enable row level security;

-- Create policy for mining history
create policy "Users can access own mining history"
on public.mining_history for all
using (telegram_id::text = auth.jwt()->> 'telegram_id');

-- Create indexes for mining_history
create index idx_mining_history_telegram_id on public.mining_history(telegram_id);
create index idx_mining_history_session_start on public.mining_history(session_start);

-- Create function to get user stats
create or replace function get_user_stats(user_telegram_id bigint)
returns json as $$
declare
  user_data record;
  stats json;
begin
  -- Get user data
  select * into user_data
  from public.users
  where telegram_id = user_telegram_id;
  
  if user_data is null then
    return json_build_object('error', 'User not found');
  end if;
  
  -- Build stats object
  select json_build_object(
    'telegram_id', user_data.telegram_id,
    'dtx_balance', user_data.dtx_balance,
    'miner_level', user_data.miner_level,
    'total_mined', user_data.total_mined,
    'mining_sessions', user_data.mining_sessions,
    'referral_count', user_data.referral_count,
    'last_claim_at', user_data.last_claim_at,
    'last_active_at', user_data.last_active_at,
    'member_since', user_data.inserted_at,
    'daily_mining_time', (
      select coalesce(sum(mining_duration), 0)
      from public.mining_history
      where telegram_id = user_telegram_id
        and session_start >= current_date
    ),
    'total_mining_time', (
      select coalesce(sum(mining_duration), 0)
      from public.mining_history
      where telegram_id = user_telegram_id
    )
  ) into stats;
  
  return stats;
end;
$$ language plpgsql security definer;

-- Create function to record mining session
create or replace function record_mining_session(
  user_telegram_id bigint,
  earned_amount numeric,
  duration_seconds int,
  user_level int
)
returns json as $$
declare
  user_exists boolean;
  result json;
begin
  -- Check if user exists
  select exists(
    select 1 from public.users 
    where telegram_id = user_telegram_id
  ) into user_exists;
  
  if not user_exists then
    return json_build_object('error', 'User not found');
  end if;
  
  -- Insert mining session
  insert into public.mining_history (
    telegram_id,
    dtx_earned,
    mining_duration,
    miner_level,
    session_start,
    session_end
  ) values (
    user_telegram_id,
    earned_amount,
    duration_seconds,
    user_level,
    now() - interval '1 second' * duration_seconds,
    now()
  );
  
  -- Update user stats
  update public.users set
    total_mined = total_mined + earned_amount,
    mining_sessions = mining_sessions + 1,
    last_active_at = now()
  where telegram_id = user_telegram_id;
  
  return json_build_object(
    'success', true,
    'earned', earned_amount,
    'duration', duration_seconds
  );
end;
$$ language plpgsql security definer;

-- Create leaderboard view
create or replace view public.leaderboard as
select 
  telegram_id,
  dtx_balance,
  miner_level,
  total_mined,
  mining_sessions,
  row_number() over (order by dtx_balance desc) as rank
from public.users
where last_active_at > now() - interval '30 days'
order by dtx_balance desc
limit 100;

-- Enable RLS for leaderboard
alter view public.leaderboard set (security_invoker = true);
