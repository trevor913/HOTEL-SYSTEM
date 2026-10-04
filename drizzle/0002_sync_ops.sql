-- Offline sync queue sink (§11). Idempotent by client op id.
create table if not exists sync_ops (
  id text primary key,
  hotel_id uuid references hotels(id) on delete cascade,
  kind text not null check (kind in ('sale', 'debt', 'payment', 'expense')),
  payload jsonb not null,
  client_at timestamptz not null,
  received_at timestamptz not null default now()
);
alter table sync_ops enable row level security;
create policy "sync_ops tenant read" on sync_ops for select using (hotel_id in (select hotel_id from staff where user_id = auth.uid()));