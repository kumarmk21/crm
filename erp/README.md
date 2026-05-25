# Manufacturing ERP prototype

React + Node.js ERP workspace for a manufacturing company, with a Supabase-ready relational schema and a runnable demo backend for local testing.

## Modules

- Admin dashboard with real-time KPIs
- Operations and inventory with BOMs, work orders, QC, and reorder alerts
- Sales CRM, sales orders, stock reservation, invoices, and PDF generation
- Finance ledger, AP, AR, and live financial statements

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`

## Structure

- `src/`: React dashboard
- `server/`: Express API and business rules
- `supabase/schema.sql`: production-oriented Postgres schema and RBAC seeds
- `docs/system-architecture.md`: architecture notes
