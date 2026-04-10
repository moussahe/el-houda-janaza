-- ============================================
-- Djanaiz - Database Schema
-- Plateforme de gestion caisse Janaza
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

create type user_role as enum ('admin', 'member');
create type member_status as enum ('pending', 'active', 'suspended');
create type subscription_type as enum ('individual', 'family');
create type payment_method as enum ('cash', 'transfer', 'check');
create type repatriation_status as enum ('declared', 'in_progress', 'repatriated', 'closed');
create type country as enum ('algeria', 'morocco', 'tunisia', 'libya', 'mauritania', 'other');
create type relationship as enum ('head', 'spouse', 'son', 'daughter', 'father', 'mother', 'brother', 'sister');

-- ============================================
-- TABLES
-- ============================================

-- Members (both admin and regular members)
create table members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null unique,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  address text not null default '',
  city text not null default '',
  date_of_birth date,
  nationality text not null default 'Algérienne',
  country_of_origin country not null default 'algeria',
  subscription_type subscription_type not null default 'individual',
  status member_status not null default 'pending',
  role user_role not null default 'member',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Families
create table families (
  id uuid primary key default uuid_generate_v4(),
  head_member_id uuid not null references members(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Family members (people covered under a family subscription)
create table family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  relationship relationship not null,
  created_at timestamptz not null default now()
);

-- Pricing plans
create table pricing_plans (
  id uuid primary key default uuid_generate_v4(),
  name_fr text not null,
  name_ar text not null,
  type subscription_type not null,
  amount numeric(10,2) not null,
  period text not null default 'annual' check (period in ('monthly', 'annual')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table payments (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  payment_method payment_method not null default 'cash',
  period_start date not null,
  period_end date not null,
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Repatriation agents
create table repatriation_agents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  countries country[] not null default '{algeria}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Repatriation cases
create table repatriation_cases (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  deceased_name text not null,
  deceased_relationship text not null default 'self',
  date_of_death date not null,
  destination_country country not null,
  agent_id uuid references repatriation_agents(id),
  cost_estimate numeric(10,2),
  cost_final numeric(10,2),
  status repatriation_status not null default 'declared',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contact messages
create table contact_messages (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  admin_reply text,
  created_at timestamptz not null default now()
);

-- Settings (key-value store for app settings like city list)
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_members_status on members(status);
create index idx_members_user_id on members(user_id);
create index idx_members_last_name on members(last_name);
create index idx_members_phone on members(phone);
create index idx_families_head on families(head_member_id);
create index idx_family_members_family on family_members(family_id);
create index idx_payments_member on payments(member_id);
create index idx_payments_date on payments(payment_date);
create index idx_repatriation_cases_status on repatriation_cases(status);
create index idx_contact_messages_read on contact_messages(is_read);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table members enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table pricing_plans enable row level security;
alter table payments enable row level security;
alter table repatriation_agents enable row level security;
alter table repatriation_cases enable row level security;
alter table contact_messages enable row level security;
alter table app_settings enable row level security;

-- Helper function: check if user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from members
    where user_id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer;

-- Helper function: get member_id from auth user
create or replace function get_member_id()
returns uuid as $$
  select id from members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer;

-- Members policies
create policy "Admin can do everything on members" on members
  for all using (is_admin());
create policy "Members can view own profile" on members
  for select using (user_id = auth.uid());
create policy "Members can update own profile" on members
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = 'member');
create policy "Anyone can insert (registration)" on members
  for insert with check (role = 'member' and status = 'pending');

-- Families policies
create policy "Admin can do everything on families" on families
  for all using (is_admin());
create policy "Members can view own family" on families
  for select using (head_member_id = get_member_id());

-- Family members policies
create policy "Admin can do everything on family_members" on family_members
  for all using (is_admin());
create policy "Members can view own family members" on family_members
  for select using (
    family_id in (select id from families where head_member_id = get_member_id())
  );

-- Pricing plans policies (everyone can read, admin can write)
create policy "Anyone can view pricing" on pricing_plans
  for select using (true);
create policy "Admin can manage pricing" on pricing_plans
  for all using (is_admin());

-- Payments policies
create policy "Admin can do everything on payments" on payments
  for all using (is_admin());
create policy "Members can view own payments" on payments
  for select using (member_id = get_member_id());

-- Repatriation agents (admin only)
create policy "Admin can manage agents" on repatriation_agents
  for all using (is_admin());

-- Repatriation cases
create policy "Admin can manage cases" on repatriation_cases
  for all using (is_admin());
create policy "Members can view own cases" on repatriation_cases
  for select using (member_id = get_member_id());

-- Contact messages
create policy "Admin can manage messages" on contact_messages
  for all using (is_admin());
create policy "Members can manage own messages" on contact_messages
  for all using (member_id = get_member_id());

-- App settings (admin only, everyone can read)
create policy "Anyone can read settings" on app_settings
  for select using (true);
create policy "Admin can manage settings" on app_settings
  for all using (is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at before update on members
  for each row execute function update_updated_at();
create trigger pricing_plans_updated_at before update on pricing_plans
  for each row execute function update_updated_at();
create trigger repatriation_cases_updated_at before update on repatriation_cases
  for each row execute function update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Default pricing plans
insert into pricing_plans (name_fr, name_ar, type, amount, period) values
  ('Cotisation individuelle', 'اشتراك فردي', 'individual', 85.00, 'annual'),
  ('Cotisation familiale', 'اشتراك عائلي', 'family', 120.00, 'annual');

-- Default cities
insert into app_settings (key, value) values
  ('cities', '["Villefranche-sur-Saône", "Lyon", "Belleville-en-Beaujolais", "Gleizé", "Arnas", "Limas", "Autre"]'),
  ('mosque_name', '"Mosquée El Houda"'),
  ('mosque_city', '"Villefranche-sur-Saône"'),
  ('mosque_phone', '""'),
  ('mosque_email', '""');
