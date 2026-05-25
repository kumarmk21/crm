-- ============================================================
-- ERP Manufacturing System - Core Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- RBAC: Roles and Permissions
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- Employees / Users
-- ============================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    role_id UUID REFERENCES roles(id),
    hire_date DATE,
    salary DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Customers
-- ============================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Suppliers
-- ============================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 30,
    lead_time_days INTEGER DEFAULT 7,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Warehouses
-- ============================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    capacity INTEGER,
    manager_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Products & Inventory
-- ============================================================

CREATE TYPE product_type AS ENUM ('finished_good', 'raw_material', 'sub_assembly', 'consumable');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type product_type NOT NULL DEFAULT 'raw_material',
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'pcs',
    unit_cost DECIMAL(12,2) DEFAULT 0,
    selling_price DECIMAL(12,2) DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- ============================================================
-- Bill of Materials (BOM)
-- ============================================================

CREATE TABLE bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bom_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID REFERENCES bom(id) ON DELETE CASCADE,
    component_id UUID REFERENCES products(id),
    quantity DECIMAL(10,4) NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'pcs',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Work Orders
-- ============================================================

CREATE TYPE work_order_status AS ENUM ('planned', 'in_production', 'quality_check', 'completed', 'cancelled');

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    bom_id UUID REFERENCES bom(id),
    quantity INTEGER NOT NULL,
    status work_order_status DEFAULT 'planned',
    planned_start DATE,
    planned_end DATE,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    assigned_to UUID REFERENCES employees(id),
    warehouse_id UUID REFERENCES warehouses(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Quality Control
-- ============================================================

CREATE TYPE qc_result AS ENUM ('pass', 'fail', 'partial');

CREATE TABLE quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES employees(id),
    batch_number VARCHAR(50),
    quantity_inspected INTEGER NOT NULL,
    quantity_passed INTEGER NOT NULL DEFAULT 0,
    quantity_failed INTEGER NOT NULL DEFAULT 0,
    result qc_result NOT NULL,
    defect_description TEXT,
    notes TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Purchase Orders
-- ============================================================

CREATE TYPE po_status AS ENUM ('draft', 'pending', 'approved', 'ordered', 'received', 'cancelled');

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    status po_status DEFAULT 'draft',
    order_date DATE,
    expected_delivery DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    quantity_received INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRM / Deal Tracking
-- ============================================================

CREATE TYPE deal_stage AS ENUM ('lead', 'quotation', 'negotiation', 'won', 'lost');

CREATE TABLE crm_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    title VARCHAR(255) NOT NULL,
    value DECIMAL(12,2) DEFAULT 0,
    stage deal_stage DEFAULT 'lead',
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    assigned_to UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Sales Orders
-- ============================================================

CREATE TYPE so_status AS ENUM ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    deal_id UUID REFERENCES crm_deals(id),
    status so_status DEFAULT 'draft',
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Invoices
-- ============================================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    customer_id UUID REFERENCES customers(id),
    status invoice_status DEFAULT 'draft',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Finance: General Ledger (Double-Entry Bookkeeping)
-- ============================================================

CREATE TYPE account_category AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category account_category NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_posted BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Accounts Payable
-- ============================================================

CREATE TYPE ap_status AS ENUM ('pending', 'approved', 'paid', 'overdue');

CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    status ap_status DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Accounts Receivable
-- ============================================================

CREATE TYPE ar_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

CREATE TABLE accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(12,2) NOT NULL,
    amount_received DECIMAL(12,2) DEFAULT 0,
    status ar_status DEFAULT 'pending',
    due_date DATE,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Inventory Alerts
-- ============================================================

CREATE TYPE alert_type AS ENUM ('low_stock', 'overstock', 'expiry');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    alert_type alert_type NOT NULL,
    status alert_status DEFAULT 'active',
    message TEXT,
    suggested_po_id UUID REFERENCES purchase_orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================
-- Seed Data: Roles
-- ============================================================

INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system access'),
    ('sales', 'Sales and CRM module access'),
    ('operations', 'Operations, manufacturing, and work order access'),
    ('warehouse_manager', 'Inventory and warehouse management access'),
    ('accountant', 'Finance and accounting module access');

-- ============================================================
-- Seed Data: Permissions
-- ============================================================

INSERT INTO permissions (name, resource, action) VALUES
    ('view_dashboard', 'dashboard', 'read'),
    ('manage_users', 'employees', 'write'),
    ('view_employees', 'employees', 'read'),
    ('manage_customers', 'customers', 'write'),
    ('view_customers', 'customers', 'read'),
    ('manage_suppliers', 'suppliers', 'write'),
    ('view_suppliers', 'suppliers', 'read'),
    ('manage_products', 'products', 'write'),
    ('view_products', 'products', 'read'),
    ('manage_inventory', 'inventory', 'write'),
    ('view_inventory', 'inventory', 'read'),
    ('manage_bom', 'bom', 'write'),
    ('view_bom', 'bom', 'read'),
    ('manage_work_orders', 'work_orders', 'write'),
    ('view_work_orders', 'work_orders', 'read'),
    ('manage_quality', 'quality', 'write'),
    ('view_quality', 'quality', 'read'),
    ('manage_purchase_orders', 'purchase_orders', 'write'),
    ('view_purchase_orders', 'purchase_orders', 'read'),
    ('manage_sales_orders', 'sales_orders', 'write'),
    ('view_sales_orders', 'sales_orders', 'read'),
    ('manage_crm', 'crm', 'write'),
    ('view_crm', 'crm', 'read'),
    ('manage_invoices', 'invoices', 'write'),
    ('view_invoices', 'invoices', 'read'),
    ('manage_finance', 'finance', 'write'),
    ('view_finance', 'finance', 'read'),
    ('manage_warehouses', 'warehouses', 'write'),
    ('view_warehouses', 'warehouses', 'read');

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin';

-- Sales permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'sales' AND p.name IN (
    'view_dashboard', 'manage_customers', 'view_customers',
    'manage_crm', 'view_crm', 'manage_sales_orders', 'view_sales_orders',
    'manage_invoices', 'view_invoices', 'view_products', 'view_inventory'
);

-- Operations permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operations' AND p.name IN (
    'view_dashboard', 'manage_products', 'view_products',
    'manage_bom', 'view_bom', 'manage_work_orders', 'view_work_orders',
    'manage_quality', 'view_quality', 'view_inventory', 'view_suppliers'
);

-- Warehouse Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'warehouse_manager' AND p.name IN (
    'view_dashboard', 'manage_inventory', 'view_inventory',
    'manage_warehouses', 'view_warehouses', 'manage_purchase_orders',
    'view_purchase_orders', 'view_products', 'view_suppliers'
);

-- Accountant permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'accountant' AND p.name IN (
    'view_dashboard', 'manage_finance', 'view_finance',
    'view_invoices', 'view_sales_orders', 'view_purchase_orders',
    'view_customers', 'view_suppliers'
);

-- ============================================================
-- Seed Data: Chart of Accounts
-- ============================================================

INSERT INTO chart_of_accounts (account_code, name, category) VALUES
    ('1000', 'Cash', 'asset'),
    ('1100', 'Accounts Receivable', 'asset'),
    ('1200', 'Inventory', 'asset'),
    ('1300', 'Prepaid Expenses', 'asset'),
    ('1500', 'Equipment', 'asset'),
    ('2000', 'Accounts Payable', 'liability'),
    ('2100', 'Accrued Liabilities', 'liability'),
    ('2200', 'Short-term Loans', 'liability'),
    ('3000', 'Owner Equity', 'equity'),
    ('3100', 'Retained Earnings', 'equity'),
    ('4000', 'Sales Revenue', 'revenue'),
    ('4100', 'Service Revenue', 'revenue'),
    ('5000', 'Cost of Goods Sold', 'expense'),
    ('5100', 'Manufacturing Overhead', 'expense'),
    ('6000', 'Salaries Expense', 'expense'),
    ('6100', 'Rent Expense', 'expense'),
    ('6200', 'Utilities Expense', 'expense'),
    ('6300', 'Marketing Expense', 'expense');
