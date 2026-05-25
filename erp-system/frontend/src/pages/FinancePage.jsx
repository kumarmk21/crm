import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const MOCK_INCOME = {
  revenue: { total: 284500, accounts: { 'Sales Revenue': 264500, 'Service Revenue': 20000 } },
  expenses: { total: 172000, accounts: { 'Cost of Goods Sold': 98000, 'Salaries Expense': 45000, 'Rent Expense': 12000, 'Utilities Expense': 8000, 'Marketing Expense': 5000, 'Manufacturing Overhead': 4000 } },
  netIncome: 112500
}

const MOCK_BALANCE = {
  balances: {
    assets: { 'Cash': 185000, 'Accounts Receivable': 89000, 'Inventory': 567800, 'Equipment': 250000 },
    liabilities: { 'Accounts Payable': 67000, 'Accrued Liabilities': 23000, 'Short-term Loans': 150000 },
    equity: { 'Owner Equity': 500000, 'Retained Earnings': 351800 }
  },
  totals: { assets: 1091800, liabilities: 240000, equity: 851800 }
}

const MOCK_CASHFLOW = {
  cashInflows: 345000,
  cashOutflows: 198000,
  netCashFlow: 147000,
  transactions: [
    { type: 'inflow', amount: 120000, description: 'Customer payments' },
    { type: 'inflow', amount: 85000, description: 'Invoice collections' },
    { type: 'inflow', amount: 140000, description: 'Service revenue' },
    { type: 'outflow', amount: 78000, description: 'Supplier payments' },
    { type: 'outflow', amount: 45000, description: 'Payroll' },
    { type: 'outflow', amount: 75000, description: 'Operating expenses' }
  ]
}

const MOCK_AP = [
  { id: '1', suppliers: { company_name: 'Steel Suppliers Co' }, purchase_orders: { po_number: 'PO-00001' }, amount: 25000, amount_paid: 0, status: 'pending', due_date: '2026-06-15' },
  { id: '2', suppliers: { company_name: 'Bearing World Inc' }, purchase_orders: { po_number: 'PO-00002' }, amount: 8500, amount_paid: 8500, status: 'paid', due_date: '2026-05-20' },
  { id: '3', suppliers: { company_name: 'Wire & Cable Ltd' }, purchase_orders: { po_number: 'PO-00003' }, amount: 12000, amount_paid: 0, status: 'overdue', due_date: '2026-05-10' },
]

const MOCK_AR = [
  { id: '1', customers: { company_name: 'Acme Corp' }, invoices: { invoice_number: 'INV-00001' }, amount: 16750, amount_received: 0, status: 'pending', due_date: '2026-06-19' },
  { id: '2', customers: { company_name: 'TechFlow Inc' }, invoices: { invoice_number: 'INV-00002' }, amount: 30850, amount_received: 30850, status: 'paid', due_date: '2026-06-14' },
  { id: '3', customers: { company_name: 'StarLight Ltd' }, invoices: { invoice_number: 'INV-00003' }, amount: 44860, amount_received: 20000, status: 'partial', due_date: '2026-05-10' },
]

const MONTHLY_CASH = [
  { month: 'Jan', inflow: 280000, outflow: 195000 },
  { month: 'Feb', inflow: 310000, outflow: 185000 },
  { month: 'Mar', inflow: 295000, outflow: 210000 },
  { month: 'Apr', inflow: 340000, outflow: 200000 },
  { month: 'May', inflow: 345000, outflow: 198000 },
]

const MOCK_LEDGER = [
  { id: '1', entry_number: 'JE-00001', entry_date: '2026-05-20', description: 'Revenue from INV-00001', is_posted: true, journal_entry_lines: [{ chart_of_accounts: { account_code: '1100', name: 'Accounts Receivable' }, debit: 16750, credit: 0 }, { chart_of_accounts: { account_code: '4000', name: 'Sales Revenue' }, debit: 0, credit: 16750 }] },
  { id: '2', entry_number: 'JE-00002', entry_date: '2026-05-18', description: 'Supplier payment PO-00002', is_posted: true, journal_entry_lines: [{ chart_of_accounts: { account_code: '2000', name: 'Accounts Payable' }, debit: 8500, credit: 0 }, { chart_of_accounts: { account_code: '1000', name: 'Cash' }, debit: 0, credit: 8500 }] },
  { id: '3', entry_number: 'JE-00003', entry_date: '2026-05-15', description: 'Payment received from TechFlow', is_posted: true, journal_entry_lines: [{ chart_of_accounts: { account_code: '1000', name: 'Cash' }, debit: 30850, credit: 0 }, { chart_of_accounts: { account_code: '1100', name: 'Accounts Receivable' }, debit: 0, credit: 30850 }] },
]

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)
}

const AP_STATUS = { pending: 'warning', approved: 'info', paid: 'success', overdue: 'danger' }
const AR_STATUS = { pending: 'warning', partial: 'info', paid: 'success', overdue: 'danger' }

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('statements')

  return (
    <div>
      <div className="page-header">
        <h2>Finance Module</h2>
        <p>Double-entry bookkeeping, statements, and account management</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'statements' ? 'active' : ''}`} onClick={() => setActiveTab('statements')}>Financial Statements</button>
        <button className={`tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>General Ledger</button>
        <button className={`tab ${activeTab === 'ap' ? 'active' : ''}`} onClick={() => setActiveTab('ap')}>Accounts Payable</button>
        <button className={`tab ${activeTab === 'ar' ? 'active' : ''}`} onClick={() => setActiveTab('ar')}>Accounts Receivable</button>
      </div>

      {activeTab === 'statements' && <FinancialStatements />}
      {activeTab === 'ledger' && <GeneralLedger />}
      {activeTab === 'ap' && <AccountsPayable />}
      {activeTab === 'ar' && <AccountsReceivable />}
    </div>
  )
}

function FinancialStatements() {
  const [statementTab, setStatementTab] = useState('income')

  return (
    <div>
      <div className="tabs" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
        <button className={`tab ${statementTab === 'income' ? 'active' : ''}`} onClick={() => setStatementTab('income')}>Income Statement</button>
        <button className={`tab ${statementTab === 'balance' ? 'active' : ''}`} onClick={() => setStatementTab('balance')}>Balance Sheet</button>
        <button className={`tab ${statementTab === 'cashflow' ? 'active' : ''}`} onClick={() => setStatementTab('cashflow')}>Cash Flow</button>
      </div>

      {statementTab === 'income' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Income Statement</h3>
            <div className="financial-section">
              <h4>Revenue</h4>
              {Object.entries(MOCK_INCOME.revenue.accounts).map(([name, amount]) => (
                <div key={name} className="financial-row">
                  <span>{name}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="financial-row total">
                <span>Total Revenue</span>
                <span style={{ color: 'var(--success)' }}>{formatCurrency(MOCK_INCOME.revenue.total)}</span>
              </div>
            </div>
            <div className="financial-section">
              <h4>Expenses</h4>
              {Object.entries(MOCK_INCOME.expenses.accounts).map(([name, amount]) => (
                <div key={name} className="financial-row">
                  <span>{name}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="financial-row total">
                <span>Total Expenses</span>
                <span style={{ color: 'var(--danger)' }}>{formatCurrency(MOCK_INCOME.expenses.total)}</span>
              </div>
            </div>
            <div className="financial-row total" style={{ fontSize: '1.1rem', marginTop: '1rem' }}>
              <span>Net Income</span>
              <span style={{ color: MOCK_INCOME.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(MOCK_INCOME.netIncome)}</span>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Revenue vs Expenses (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MONTHLY_CASH}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="inflow" name="Revenue" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="outflow" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {statementTab === 'balance' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Balance Sheet</h3>
            <div className="financial-section">
              <h4>Assets</h4>
              {Object.entries(MOCK_BALANCE.balances.assets).map(([name, amount]) => (
                <div key={name} className="financial-row">
                  <span>{name}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="financial-row total">
                <span>Total Assets</span>
                <span>{formatCurrency(MOCK_BALANCE.totals.assets)}</span>
              </div>
            </div>
            <div className="financial-section">
              <h4>Liabilities</h4>
              {Object.entries(MOCK_BALANCE.balances.liabilities).map(([name, amount]) => (
                <div key={name} className="financial-row">
                  <span>{name}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="financial-row total">
                <span>Total Liabilities</span>
                <span>{formatCurrency(MOCK_BALANCE.totals.liabilities)}</span>
              </div>
            </div>
            <div className="financial-section">
              <h4>Equity</h4>
              {Object.entries(MOCK_BALANCE.balances.equity).map(([name, amount]) => (
                <div key={name} className="financial-row">
                  <span>{name}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="financial-row total">
                <span>Total Equity</span>
                <span>{formatCurrency(MOCK_BALANCE.totals.equity)}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Asset Composition</h3>
            <div style={{ padding: '1rem' }}>
              {Object.entries(MOCK_BALANCE.balances.assets).map(([name, amount]) => (
                <div key={name} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span>{name}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: 'var(--primary)', borderRadius: '4px', height: '8px', width: `${(amount / MOCK_BALANCE.totals.assets) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {statementTab === 'cashflow' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Cash Flow Statement</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)', fontSize: '1.25rem' }}>{formatCurrency(MOCK_CASHFLOW.cashInflows)}</div>
                <div className="stat-label">Cash Inflows</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.25rem' }}>{formatCurrency(MOCK_CASHFLOW.cashOutflows)}</div>
                <div className="stat-label">Cash Outflows</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(MOCK_CASHFLOW.netCashFlow)}</div>
                <div className="stat-label">Net Cash Flow</div>
              </div>
            </div>
            <div className="financial-section" style={{ marginTop: '1rem' }}>
              <h4>Transactions</h4>
              {MOCK_CASHFLOW.transactions.map((t, i) => (
                <div key={i} className="financial-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${t.type === 'inflow' ? 'success' : 'danger'}`}>{t.type === 'inflow' ? '↑' : '↓'}</span>
                    {t.description}
                  </span>
                  <span style={{ color: t.type === 'inflow' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Cash Flow Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MONTHLY_CASH}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Line type="monotone" dataKey="inflow" name="Inflows" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="outflow" name="Outflows" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function GeneralLedger() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Journal Entries (Double-Entry Bookkeeping)</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Entry #</th>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEDGER.map(entry => (
              entry.journal_entry_lines.map((line, idx) => (
                <tr key={`${entry.id}-${idx}`}>
                  {idx === 0 && (
                    <>
                      <td rowSpan={entry.journal_entry_lines.length}><strong>{entry.entry_number}</strong></td>
                      <td rowSpan={entry.journal_entry_lines.length}>{entry.entry_date}</td>
                      <td rowSpan={entry.journal_entry_lines.length}>{entry.description}</td>
                    </>
                  )}
                  <td style={{ paddingLeft: line.debit > 0 ? '1rem' : '2rem' }}>
                    {line.chart_of_accounts.account_code} - {line.chart_of_accounts.name}
                  </td>
                  <td>{line.debit > 0 ? formatCurrency(line.debit) : ''}</td>
                  <td>{line.credit > 0 ? formatCurrency(line.credit) : ''}</td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountsPayable() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Accounts Payable</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>PO Reference</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AP.map(ap => (
              <tr key={ap.id}>
                <td><strong>{ap.suppliers.company_name}</strong></td>
                <td>{ap.purchase_orders?.po_number}</td>
                <td>{formatCurrency(ap.amount)}</td>
                <td>{formatCurrency(ap.amount_paid)}</td>
                <td style={{ color: ap.amount - ap.amount_paid > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {formatCurrency(ap.amount - ap.amount_paid)}
                </td>
                <td>{ap.due_date}</td>
                <td><span className={`badge ${AP_STATUS[ap.status]}`}>{ap.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountsReceivable() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Accounts Receivable</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Received</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AR.map(ar => (
              <tr key={ar.id}>
                <td><strong>{ar.customers.company_name}</strong></td>
                <td>{ar.invoices?.invoice_number}</td>
                <td>{formatCurrency(ar.amount)}</td>
                <td>{formatCurrency(ar.amount_received)}</td>
                <td style={{ color: ar.amount - ar.amount_received > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatCurrency(ar.amount - ar.amount_received)}
                </td>
                <td>{ar.due_date}</td>
                <td><span className={`badge ${AR_STATUS[ar.status]}`}>{ar.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
