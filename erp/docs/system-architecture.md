# Manufacturing ERP Architecture

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database target: Supabase Postgres with row-level security
- Runtime demo store: in-memory seed data used to exercise workflows in Cursor Cloud

## Core domains

### Master data

- Customers
- Suppliers
- Products
- Warehouses
- Employees
- Roles, permissions, and role grants

### Operations and inventory

- Bills of materials
- Work orders with stage transitions
- Inventory stock, reservations, reorder thresholds, and purchase orders
- Quality-control logs

### Sales

- CRM clients and deal stages
- Sales orders
- Invoices and PDF output

### Finance

- Chart of accounts
- Journal entries and journal entry lines
- Accounts payable and accounts receivable
- Income statement, balance sheet, and cash flow reporting

## Business rules

1. Completing a work order moves quantities from BOM components into finished goods inventory.
2. Confirming a sales order reserves finished-good stock immediately.
3. Low inventory creates a purchase-order draft suggestion.
4. Confirming a purchase order logs accounts payable and replenishes stock in the demo flow.
5. Creating an invoice posts accounts receivable and revenue.
6. Recording a payment closes receivables and increases cash.

## RBAC model

Application roles:

- Admin
- Sales
- Operations
- Warehouse Manager
- Accountant

Permissions are stored in normalized tables and can be enforced through Supabase RLS using the authenticated employee plus role grants. The React demo also sends a `x-demo-role` header so the Node API can exercise the permission map without a live auth provider.

## Production Supabase design

- `employees.auth_user_id` links business employees to `auth.users`
- `user_roles`, `roles`, `permissions`, and `role_permissions` normalize grants
- RLS policies check the employee role grants before permitting reads or writes
- Operational posting flows emit `journal_entries` + `journal_entry_lines` instead of mutating finance tables directly

## Frontend layout

- Admin Dashboard: KPI cards, RBAC matrix, alerts, and cross-module health
- Operations & Inventory: BOM builder, work-order Kanban, stock tracker, purchase orders, QC
- Sales: CRM pipeline, SO generation, reservation workflow, invoice generator, PDF download
- Finance: AP, AR, ledger, and live statements
