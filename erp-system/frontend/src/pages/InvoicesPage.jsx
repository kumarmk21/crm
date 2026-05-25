import { useState } from 'react'
import { Plus, Download, CreditCard, X } from 'lucide-react'

const MOCK_INVOICES = [
  { id: '1', invoice_number: 'INV-00001', customers: { company_name: 'Acme Corp' }, sales_orders: { so_number: 'SO-00001' }, status: 'sent', issue_date: '2026-05-20', due_date: '2026-06-19', subtotal: 15000, tax_rate: 10, tax_amount: 1500, discount_amount: 0, shipping_fee: 250, total_amount: 16750, amount_paid: 0 },
  { id: '2', invoice_number: 'INV-00002', customers: { company_name: 'TechFlow Inc' }, sales_orders: { so_number: 'SO-00002' }, status: 'paid', issue_date: '2026-05-15', due_date: '2026-06-14', subtotal: 28500, tax_rate: 10, tax_amount: 2850, discount_amount: 500, shipping_fee: 0, total_amount: 30850, amount_paid: 30850 },
  { id: '3', invoice_number: 'INV-00003', customers: { company_name: 'StarLight Ltd' }, sales_orders: { so_number: 'SO-00004' }, status: 'overdue', issue_date: '2026-04-10', due_date: '2026-05-10', subtotal: 42000, tax_rate: 8, tax_amount: 3360, discount_amount: 1000, shipping_fee: 500, total_amount: 44860, amount_paid: 20000 },
  { id: '4', invoice_number: 'INV-00004', customers: { company_name: 'Delta Systems' }, sales_orders: { so_number: 'SO-00005' }, status: 'paid', issue_date: '2026-05-01', due_date: '2026-05-31', subtotal: 19800, tax_rate: 10, tax_amount: 1980, discount_amount: 0, shipping_fee: 150, total_amount: 21930, amount_paid: 21930 },
]

const STATUS_BADGES = { draft: 'neutral', sent: 'info', paid: 'success', overdue: 'danger', cancelled: 'neutral' }

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(MOCK_INVOICES)
  const [showGenerate, setShowGenerate] = useState(false)
  const [formData, setFormData] = useState({ sales_order: '', tax_rate: 10, discount: 0, shipping: 0, due_days: 30 })

  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.total_amount - i.amount_paid), 0)

  const handleGenerate = (e) => {
    e.preventDefault()
    const newInvoice = {
      id: String(Date.now()),
      invoice_number: `INV-${String(invoices.length + 1).padStart(5, '0')}`,
      customers: { company_name: 'New Customer' },
      sales_orders: { so_number: formData.sales_order },
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + formData.due_days * 86400000).toISOString().split('T')[0],
      subtotal: 10000,
      tax_rate: formData.tax_rate,
      tax_amount: 10000 * formData.tax_rate / 100,
      discount_amount: Number(formData.discount),
      shipping_fee: Number(formData.shipping),
      total_amount: 10000 + (10000 * formData.tax_rate / 100) - Number(formData.discount) + Number(formData.shipping),
      amount_paid: 0
    }
    setInvoices([newInvoice, ...invoices])
    setShowGenerate(false)
  }

  const recordPayment = (id) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, amount_paid: inv.total_amount, status: 'paid' }
      }
      return inv
    }))
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Invoices</h2>
          <p>Generate and manage customer invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{invoices.length}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0))}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(totalOutstanding)}</div>
          <div className="stat-label">Outstanding</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{invoices.filter(i => i.status === 'overdue').length}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>SO Ref</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.customers.company_name}</td>
                  <td>{inv.sales_orders?.so_number}</td>
                  <td>{inv.issue_date}</td>
                  <td>{inv.due_date}</td>
                  <td>{formatCurrency(inv.total_amount)}</td>
                  <td>{formatCurrency(inv.amount_paid)}</td>
                  <td style={{ color: inv.total_amount - inv.amount_paid > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatCurrency(inv.total_amount - inv.amount_paid)}
                  </td>
                  <td><span className={`badge ${STATUS_BADGES[inv.status]}`}>{inv.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-secondary btn-sm" title="Download PDF"><Download size={12} /></button>
                      {inv.status !== 'paid' && (
                        <button className="btn btn-success btn-sm" onClick={() => recordPayment(inv.id)} title="Record Payment">
                          <CreditCard size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showGenerate && (
        <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Invoice</h3>
              <button className="modal-close" onClick={() => setShowGenerate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>From Sales Order</label>
                <select value={formData.sales_order} onChange={(e) => setFormData({...formData, sales_order: e.target.value})} required>
                  <option value="">Select sales order...</option>
                  <option value="SO-00001">SO-00001 - Acme Corp ($15,000)</option>
                  <option value="SO-00002">SO-00002 - TechFlow Inc ($28,500)</option>
                  <option value="SO-00003">SO-00003 - Global Mfg ($7,200)</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input type="number" min="0" max="30" step="0.5" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Discount ($)</label>
                  <input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shipping Fee ($)</label>
                  <input type="number" min="0" step="0.01" value={formData.shipping} onChange={(e) => setFormData({...formData, shipping: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Payment Terms (days)</label>
                  <input type="number" min="1" value={formData.due_days} onChange={(e) => setFormData({...formData, due_days: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
