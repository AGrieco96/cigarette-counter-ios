alter table public.profiles enable row level security;
alter table public.smoke_events enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
for delete using (auth.uid() = id);

create policy "smoke_events_select_own" on public.smoke_events
for select using (auth.uid() = user_id);

create policy "smoke_events_insert_own" on public.smoke_events
for insert with check (auth.uid() = user_id);

create policy "smoke_events_update_own" on public.smoke_events
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "smoke_events_delete_own" on public.smoke_events
for delete using (auth.uid() = user_id);
