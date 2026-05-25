create extension if not exists pgcrypto;

create type public.app_role as enum (
  'admin',
  'sales',
  'operations',
  'warehouse_manager',
  'accountant'
);

create type public.product_kind as enum (
  'raw_material',
  'sub_assembly',
  'finished_good'
);

create type public.work_order_stage as enum (
  'planned',
  'in_production',
  'quality_check',
  'completed'
);

create type public.deal_stage as enum (
  'lead',
  'quotation',
  'negotiation',
  'won',
  'lost'
);

create type public.sales_order_status as enum (
  'draft',
  'confirmed',
  'invoiced',
  'paid'
);

create type public.purchase_order_status as enum (
  'draft',
  'confirmed',
  'received',
  'closed'
);

create type public.invoice_status as enum (
  'sent',
  'paid',
  'void'
);

create type public.account_category as enum (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_number text unique not null,
  full_name text not null,
  email text unique not null,
  title text not null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  employee_id uuid not null references public.employees(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (employee_id, role_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  billing_address text,
  shipping_address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text unique not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  lead_time_days integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  kind public.product_kind not null,
  unit_of_measure text not null,
  standard_cost numeric(14,2) not null default 0,
  sale_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.boms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  revision text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, revision)
);

create table public.bom_lines (
  id uuid primary key default gen_random_uuid(),
  bom_id uuid not null references public.boms(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  location text not null,
  stock_level numeric(14,4) not null default 0,
  reserved_stock numeric(14,4) not null default 0,
  reorder_point numeric(14,4) not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, warehouse_id, location)
);

create table public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  stage public.deal_stage not null default 'lead',
  estimated_value numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  product_id uuid not null references public.products(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  quantity numeric(14,4) not null check (quantity > 0),
  stage public.work_order_stage not null default 'planned',
  due_date date,
  priority text not null default 'medium',
  notes text,
  created_at timestamptz not null default now()
);

create table public.quality_logs (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  batch_code text not null,
  passed_units numeric(14,4) not null default 0,
  failed_units numeric(14,4) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status public.purchase_order_status not null default 'draft',
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  source_alert_sku text,
  created_at timestamptz not null default now()
);

create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  crm_client_id uuid not null references public.crm_clients(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  status public.sales_order_status not null default 'draft',
  shipping_address text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  sales_order_id uuid not null references public.sales_orders(id) on delete restrict,
  status public.invoice_status not null default 'sent',
  subtotal numeric(14,2) not null default 0,
  discount_rate numeric(8,4) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tax_rate numeric(8,4) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  shipping_fee numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category public.account_category not null,
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_number text unique not null,
  source_type text not null,
  source_id uuid,
  memo text not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  check (debit = 0 or credit = 0)
);

create index inventory_items_product_idx on public.inventory_items (product_id);
create index work_orders_stage_idx on public.work_orders (stage);
create index sales_orders_status_idx on public.sales_orders (status);
create index invoices_status_idx on public.invoices (status);
create index journal_entry_lines_account_idx on public.journal_entry_lines (account_id);

insert into public.roles (code, name)
values
  ('admin', 'Admin'),
  ('sales', 'Sales'),
  ('operations', 'Operations'),
  ('warehouse_manager', 'Warehouse Manager'),
  ('accountant', 'Accountant')
on conflict (code) do nothing;

insert into public.permissions (code, description)
values
  ('dashboard.view', 'View KPI dashboards'),
  ('customers.manage', 'Manage customers'),
  ('suppliers.manage', 'Manage suppliers'),
  ('bom.manage', 'Manage bills of materials'),
  ('work_orders.manage', 'Manage work orders'),
  ('inventory.view', 'View inventory'),
  ('inventory.adjust', 'Adjust inventory levels'),
  ('purchase_orders.manage', 'Create and confirm purchase orders'),
  ('quality_control.log', 'Record quality control results'),
  ('crm.manage', 'Manage CRM clients and stages'),
  ('sales_orders.manage', 'Create and confirm sales orders'),
  ('invoices.manage', 'Create and download invoices'),
  ('ledger.view', 'View ledger data'),
  ('ledger.post', 'Post accounting entries'),
  ('financial_reports.view', 'View financial statements'),
  ('payments.record', 'Record AR payments')
on conflict (code) do nothing;

with role_map as (
  select id, code from public.roles
),
permission_map as (
  select id, code from public.permissions
),
matrix(role_code, permission_code) as (
  values
    ('admin', 'dashboard.view'),
    ('admin', 'customers.manage'),
    ('admin', 'suppliers.manage'),
    ('admin', 'bom.manage'),
    ('admin', 'work_orders.manage'),
    ('admin', 'inventory.view'),
    ('admin', 'inventory.adjust'),
    ('admin', 'purchase_orders.manage'),
    ('admin', 'quality_control.log'),
    ('admin', 'crm.manage'),
    ('admin', 'sales_orders.manage'),
    ('admin', 'invoices.manage'),
    ('admin', 'ledger.view'),
    ('admin', 'ledger.post'),
    ('admin', 'financial_reports.view'),
    ('admin', 'payments.record'),
    ('sales', 'dashboard.view'),
    ('sales', 'customers.manage'),
    ('sales', 'crm.manage'),
    ('sales', 'sales_orders.manage'),
    ('sales', 'invoices.manage'),
    ('operations', 'dashboard.view'),
    ('operations', 'bom.manage'),
    ('operations', 'work_orders.manage'),
    ('operations', 'inventory.view'),
    ('operations', 'quality_control.log'),
    ('warehouse_manager', 'dashboard.view'),
    ('warehouse_manager', 'inventory.view'),
    ('warehouse_manager', 'inventory.adjust'),
    ('warehouse_manager', 'purchase_orders.manage'),
    ('warehouse_manager', 'work_orders.manage'),
    ('accountant', 'dashboard.view'),
    ('accountant', 'invoices.manage'),
    ('accountant', 'ledger.view'),
    ('accountant', 'ledger.post'),
    ('accountant', 'financial_reports.view'),
    ('accountant', 'payments.record')
)
insert into public.role_permissions (role_id, permission_id)
select role_map.id, permission_map.id
from matrix
join role_map on role_map.code = matrix.role_code::public.app_role
join permission_map on permission_map.code = matrix.permission_code
on conflict do nothing;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
as $$
  select e.id
  from public.employees e
  where e.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where ur.employee_id = public.current_employee_id()
      and p.code = permission_code
  )
$$;

alter table public.customers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

create policy "dashboard viewers can read customers"
on public.customers
for select
using (public.has_permission('dashboard.view'));

create policy "inventory viewers can read inventory"
on public.inventory_items
for select
using (public.has_permission('inventory.view'));

create policy "warehouse managers can adjust inventory"
on public.inventory_items
for update
using (public.has_permission('inventory.adjust'))
with check (public.has_permission('inventory.adjust'));

create policy "finance viewers can read journal entries"
on public.journal_entries
for select
using (public.has_permission('ledger.view'));

create policy "finance viewers can read journal lines"
on public.journal_entry_lines
for select
using (public.has_permission('ledger.view'));
