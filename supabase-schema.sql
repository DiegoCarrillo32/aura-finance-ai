-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linked to supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default 'USD' not null,
  hourly_rate numeric(12,2) default 0.00 not null,
  hourly_rate_type text check (hourly_rate_type in ('manual', 'auto')) default 'auto' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
create policy "Users can view and edit their own profile." on public.profiles
  for all using (auth.uid() = id);

-- 2. Incomes Table
create table public.incomes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  source text not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'one_time')),
  start_date date not null default current_date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.incomes enable row level security;
create policy "Users can manage their own incomes." on public.incomes
  for all using (auth.uid() = user_id);

-- 3. Fixed Expenses Table
create table public.fixed_expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  name text not null,
  category text not null,
  due_date_day integer check (due_date_day >= 1 and due_date_day <= 31),
  frequency text check (frequency in ('monthly', 'yearly')) default 'monthly' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.fixed_expenses enable row level security;
create policy "Users can manage their own fixed expenses." on public.fixed_expenses
  for all using (auth.uid() = user_id);

-- 4. Budgets Table (discretionary spending categories)
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  limit_amount numeric(12,2) not null check (limit_amount >= 0),
  period text default 'monthly' check (period = 'monthly') not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category)
);

alter table public.budgets enable row level security;
create policy "Users can manage their own budgets." on public.budgets
  for all using (auth.uid() = user_id);

-- 5. Savings Goals Table
create table public.savings_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) default 0.00 not null check (current_amount >= 0),
  target_date date not null,
  status text check (status in ('active', 'completed', 'paused')) default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.savings_goals enable row level security;
create policy "Users can manage their own savings goals." on public.savings_goals
  for all using (auth.uid() = user_id);

-- 6. Chat Sessions & Messages (for AI Assistant history and actions)
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New Conversation' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_sessions enable row level security;
create policy "Users can manage their own sessions." on public.chat_sessions
  for all using (auth.uid() = user_id);

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  action_payload jsonb default null, -- draft action parameters, e.g. { "type": "create_savings_goal", "data": {...} }
  action_executed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_messages enable row level security;
create policy "Users can manage their session messages." on public.chat_messages
  for all using (
    exists (
      select 1 from public.chat_sessions 
      where chat_sessions.id = chat_messages.session_id 
      and chat_sessions.user_id = auth.uid()
    )
  );

-- 7. Trigger to automatically create a profile for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, currency, hourly_rate, hourly_rate_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    'USD',
    0.00,
    'auto'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
