-- Row Level Security for every tenant table (§10).
-- A user may only touch rows of the hotel their profile belongs to.
create or replace function public.current_hotel_id() returns uuid
language sql stable security definer set search_path = public as $$
  select hotel_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role_is(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role::text = r)
$$;

do $$
declare t text;
begin
  foreach t in array array['customers','debts','menu_items','daily_menus','sales','expenses','suppliers',
    'inventory_items','orders','mpesa_txns','staff_shifts','ai_messages','notifications','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists tenant_select on public.%I', t);
    execute format('create policy tenant_select on public.%I for select using (hotel_id = public.current_hotel_id() or public.current_role_is(''admin''))', t);
    execute format('drop policy if exists tenant_write on public.%I', t);
    execute format('create policy tenant_write on public.%I for all using (hotel_id = public.current_hotel_id()) with check (hotel_id = public.current_hotel_id())', t);
  end loop;
end $$;

-- Child tables inherit tenancy through their parent
alter table public.debt_payments enable row level security;
create policy tenant_all on public.debt_payments for all
  using (exists (select 1 from public.debts d where d.id = debt_id and d.hotel_id = public.current_hotel_id()));
alter table public.sale_items enable row level security;
create policy tenant_all on public.sale_items for all
  using (exists (select 1 from public.sales s where s.id = sale_id and s.hotel_id = public.current_hotel_id()));
alter table public.order_items enable row level security;
create policy tenant_all on public.order_items for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.hotel_id = public.current_hotel_id()));
alter table public.supplier_txns enable row level security;
create policy tenant_all on public.supplier_txns for all
  using (exists (select 1 from public.suppliers s where s.id = supplier_id and s.hotel_id = public.current_hotel_id()));
alter table public.stock_moves enable row level security;
create policy tenant_all on public.stock_moves for all
  using (exists (select 1 from public.inventory_items i where i.id = inventory_item_id and i.hotel_id = public.current_hotel_id()));

-- Staff cannot read report-grade tables (expenses): owners/admin only
drop policy if exists tenant_select on public.expenses;
create policy tenant_select on public.expenses for select
  using (hotel_id = public.current_hotel_id() and not public.current_role_is('staff'));

-- Hotels & profiles
alter table public.hotels enable row level security;
create policy hotel_owner on public.hotels for all using (owner_id = auth.uid() or id = public.current_hotel_id());
create policy hotel_public_read on public.hotels for select using (true); -- public menu /m/[slug]
alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all using (id = auth.uid() or hotel_id = public.current_hotel_id());

-- Public menu reads available items anonymously
create policy menu_public_read on public.menu_items for select using (is_available = true);
