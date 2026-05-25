import { useState } from 'react'
import { Plus, X, Check, FileText } from 'lucide-react'

const MOCK_ORDERS = [
  { id: '1', so_number: 'SO-00001', customers: { company_name: 'Acme Corp' }, status: 'confirmed', order_date: '2026-05-20', total_amount: 15000, sales_order_lines: [{ products: { name: 'Hydraulic Pump', sku: 'FG-001' }, quantity: 10, unit_price: 1500 }] },
  { id: '2', so_number: 'SO-00002', customers: { company_name: 'TechFlow Inc' }, status: 'processing', order_date: '2026-05-19', total_amount: 28500, sales_order_lines: [{ products: { name: 'Electric Motor', sku: 'FG-002' }, quantity: 30, unit_price: 950 }] },
  { id: '3', so_number: 'SO-00003', customers: { company_name: 'Global Mfg' }, status: 'draft', order_date: '2026-05-18', total_amount: 7200, sales_order_lines: [{ products: { name: 'Gear Box', sku: 'SA-005' }, quantity: 40, unit_price: 180 }] },
  { id: '4', so_number: 'SO-00004', customers: { company_name: 'StarLight Ltd' }, status: 'shipped', order_date: '2026-05-17', total_amount: 42000, sales_order_lines: [{ products: { name: 'Hydraulic Pump', sku: 'FG-001' }, quantity: 28, unit_price: 1500 }] },
  { id: '5', so_number: 'SO-00005', customers: { company_name: 'Delta Systems' }, status: 'delivered', order_date: '2026-05-10', total_amount: 19800, sales_order_lines: [{ products: { name: 'Electric Motor', sku: 'FG-002' }, quantity: 20, unit_price: 990 }] },
]

const STATUS_BADGES = {
  draft: 'neutral', confirmed: 'info', processing: 'warning', shipped: 'success', delivered: 'success', cancelled: 'danger'
}

export default function SalesPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ customer: '', delivery_date: '', notes: '' })
  const [lines, setLines] = useState([{ product: '', quantity: 1, unit_price: 0 }])

  const addLine = () => setLines([...lines, { product: '', quantity: 1, unit_price: 0 }])
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx))
  const updateLine = (idx, field, value) => { const u = [...lines]; u[idx][field] = value; setLines(u) }

  const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unit_price), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newOrder = {
      id: String(Date.now()),
      so_number: `SO-${String(orders.length + 1).padStart(5, '0')}`,
      customers: { company_name: formData.customer },
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
      total_amount: subtotal,
      sales_order_lines: lines.map(l => ({ products: { name: l.product, sku: '' }, quantity: l.quantity, unit_price: l.unit_price }))
    }
    setOrders([newOrder, ...orders])
    setShowModal(false)
    setFormData({ customer: '', delivery_date: '', notes: '' })
    setLines([{ product: '', quantity: 1, unit_price: 0 }])
  }

  const confirmOrder = (id) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'confirmed' } : o))
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Sales Orders</h2>
          <p>Manage and track customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Sales Order
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${orders.reduce((s, o) => s + o.total_amount, 0).toLocaleString()}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.filter(o => ['draft','confirmed','processing'].includes(o.status)).length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{orders.filter(o => o.status === 'delivered').length}</div>
          <div className="stat-label">Delivered</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.so_number}</strong></td>
                  <td>{order.customers.company_name}</td>
                  <td>{order.order_date}</td>
                  <td>{order.sales_order_lines.length} item(s)</td>
                  <td>${order.total_amount.toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_BADGES[order.status]}`}>{order.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {order.status === 'draft' && (
                        <button className="btn btn-success btn-sm" onClick={() => confirmOrder(order.id)}>
                          <Check size={12} /> Confirm
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm"><FileText size={12} /> Invoice</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Create Sales Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer</label>
                  <select value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} required>
                    <option value="">Select customer...</option>
                    <option value="Acme Corp">Acme Corp</option>
                    <option value="TechFlow Inc">TechFlow Inc</option>
                    <option value="Global Mfg">Global Mfg</option>
                    <option value="StarLight Ltd">StarLight Ltd</option>
                    <option value="Delta Systems">Delta Systems</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Date</label>
                  <input type="date" value={formData.delivery_date} onChange={(e) => setFormData({...formData, delivery_date: e.target.value})} required />
                </div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Line Items</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={12} /> Add Item</button>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <label>Product</label>
                      <select value={line.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="Hydraulic Pump Assembly">Hydraulic Pump Assembly</option>
                        <option value="Electric Motor 5HP">Electric Motor 5HP</option>
                        <option value="Gear Box Sub-Assembly">Gear Box Sub-Assembly</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Unit Price</label>
                      <input type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', Number(e.target.value))} required />
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(idx)}>×</button>
                  </div>
                ))}
                <div style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 600 }}>
                  Subtotal: ${subtotal.toLocaleString()}
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
