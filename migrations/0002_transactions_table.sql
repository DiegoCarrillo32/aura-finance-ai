-- 8. Transactions Table (for tracking individual expenditures)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Users can manage their own transactions." on public.transactions
  for all using (auth.uid() = user_id);
