# ManuERP - Manufacturing Enterprise Resource Planning System

A full-stack ERP system designed for manufacturing companies, built with React, Node.js, and Supabase.

## Architecture

```
erp-system/
├── frontend/          # React (Vite) SPA
├── backend/           # Node.js/Express API
└── database/          # Supabase PostgreSQL schema & migrations
```

## Modules

### Phase 1 - Core System
- **Database Schema**: Relational tables for Customers, Suppliers, Products/BOMs, Warehouses, Employees, and Ledgers
- **RBAC**: Role-based access control (Admin, Sales, Operations, Warehouse Manager, Accountant)
- **Dashboard**: Real-time KPIs (Total Revenue, Pending Orders, Inventory Value, Monthly Expenses)

### Phase 2 - Operations & Inventory
- **Bill of Materials (BOM)**: Define product composition with sub-assemblies and raw materials
- **Work Orders**: Kanban board (Planned → In-Production → Quality Check → Completed) with automatic inventory decrement
- **Inventory Management**: Real-time stock tracker with SKU, reorder points, and automated alerts
- **Quality Control**: Pass/fail metrics logging for completed batches

### Phase 3 - Sales
- **CRM**: Deal pipeline tracking (Lead → Quotation → Negotiation → Won/Lost)
- **Sales Orders**: Automated SO generator with stock reservation on confirmation
- **Invoicing**: Invoice generator with taxes, discounts, shipping, and PDF download

### Phase 4 - Finance
- **General Ledger**: Double-entry bookkeeping (Debits/Credits)
- **Accounts Payable**: Auto-populated from confirmed Purchase Orders
- **Accounts Receivable**: Logged from Sales Order invoices
- **Financial Statements**: Income Statement, Balance Sheet, and Cash Flow

## Tech Stack

| Layer      | Technology        |
|-----------|-------------------|
| Frontend  | React 19 + Vite   |
| Backend   | Node.js + Express |
| Database  | Supabase (PostgreSQL) |
| Charts    | Recharts          |
| Icons     | Lucide React      |
| PDF       | PDFKit            |

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (or local instance)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Update .env with your Supabase credentials
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
1. Create a new Supabase project
2. Run the SQL in `database/schema.sql` in the Supabase SQL Editor
3. Update backend `.env` with your project URL and keys

## RBAC Roles & Permissions

| Role              | Modules                                       |
|-------------------|-----------------------------------------------|
| Admin             | Full system access                           |
| Sales             | CRM, Sales Orders, Invoices, Customers       |
| Operations        | Products, BOM, Work Orders, Quality Control  |
| Warehouse Manager | Inventory, Warehouses, Purchase Orders       |
| Accountant        | Finance, Ledger, AP/AR, Statements           |
