import { useState } from 'react'
import { Plus, Check, Package, X } from 'lucide-react'

const MOCK_POS = [
  { id: '1', po_number: 'PO-00001', suppliers: { company_name: 'Steel Suppliers Co' }, status: 'approved', order_date: '2026-05-15', expected_delivery: '2026-05-25', total_amount: 25000, purchase_order_lines: [{ products: { name: 'Steel Bolt M8', sku: 'RM-001' }, quantity: 5000, unit_price: 0.45 }, { products: { name: 'Aluminum Sheet 2mm', sku: 'RM-012' }, quantity: 200, unit_price: 12.50 }] },
  { id: '2', po_number: 'PO-00002', suppliers: { company_name: 'Bearing World Inc' }, status: 'received', order_date: '2026-05-10', expected_delivery: '2026-05-18', total_amount: 8500, purchase_order_lines: [{ products: { name: 'Bearing SKF 6205', sku: 'RM-034' }, quantity: 500, unit_price: 8.75 }] },
  { id: '3', po_number: 'PO-00003', suppliers: { company_name: 'Wire & Cable Ltd' }, status: 'ordered', order_date: '2026-05-20', expected_delivery: '2026-06-01', total_amount: 12000, purchase_order_lines: [{ products: { name: 'Copper Wire 2.5mm', sku: 'RM-045' }, quantity: 5000, unit_price: 2.30 }] },
  { id: '4', po_number: 'PO-00004', suppliers: { company_name: 'Steel Suppliers Co' }, status: 'draft', order_date: '2026-05-22', expected_delivery: '2026-06-05', total_amount: 3200, purchase_order_lines: [{ products: { name: 'Steel Bolt M8', sku: 'RM-001' }, quantity: 2000, unit_price: 0.45 }] },
]

const STATUS_BADGES = { draft: 'neutral', pending: 'warning', approved: 'info', ordered: 'info', received: 'success', cancelled: 'danger' }

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState(MOCK_POS)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ supplier: '', expected_delivery: '', notes: '' })
  const [lines, setLines] = useState([{ product: '', quantity: 1, unit_price: 0 }])

  const addLine = () => setLines([...lines, { product: '', quantity: 1, unit_price: 0 }])
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx))
  const updateLine = (idx, field, value) => { const u = [...lines]; u[idx][field] = value; setLines(u) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.unit_price), 0)
    const newPO = {
      id: String(Date.now()),
      po_number: `PO-${String(orders.length + 1).padStart(5, '0')}`,
      suppliers: { company_name: formData.supplier },
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: formData.expected_delivery,
      total_amount: totalAmount,
      purchase_order_lines: lines.map(l => ({ products: { name: l.product, sku: '' }, quantity: l.quantity, unit_price: l.unit_price }))
    }
    setOrders([newPO, ...orders])
    setShowModal(false)
    setFormData({ supplier: '', expected_delivery: '', notes: '' })
    setLines([{ product: '', quantity: 1, unit_price: 0 }])
  }

  const approveOrder = (id) => setOrders(orders.map(o => o.id === id ? { ...o, status: 'approved' } : o))
  const receiveOrder = (id) => setOrders(orders.map(o => o.id === id ? { ...o, status: 'received' } : o))

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Purchase Orders</h2>
          <p>Manage supplier orders and receiving</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New PO
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total POs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(orders.reduce((s, o) => s + o.total_amount, 0))}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.filter(o => ['draft', 'pending', 'approved', 'ordered'].includes(o.status)).length}</div>
          <div className="stat-label">Pending Delivery</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{orders.filter(o => o.status === 'received').length}</div>
          <div className="stat-label">Received</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Expected</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.po_number}</strong></td>
                  <td>{order.suppliers.company_name}</td>
                  <td>{order.order_date}</td>
                  <td>{order.expected_delivery}</td>
                  <td>{order.purchase_order_lines.length} item(s)</td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td><span className={`badge ${STATUS_BADGES[order.status]}`}>{order.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {order.status === 'draft' && (
                        <button className="btn btn-success btn-sm" onClick={() => approveOrder(order.id)}>
                          <Check size={12} /> Approve
                        </button>
                      )}
                      {(order.status === 'approved' || order.status === 'ordered') && (
                        <button className="btn btn-primary btn-sm" onClick={() => receiveOrder(order.id)}>
                          <Package size={12} /> Receive
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <select value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} required>
                    <option value="">Select supplier...</option>
                    <option value="Steel Suppliers Co">Steel Suppliers Co</option>
                    <option value="Bearing World Inc">Bearing World Inc</option>
                    <option value="Wire & Cable Ltd">Wire & Cable Ltd</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected Delivery</label>
                  <input type="date" value={formData.expected_delivery} onChange={(e) => setFormData({...formData, expected_delivery: e.target.value})} required />
                </div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Items</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={12} /> Add</button>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <label>Product</label>
                      <select value={line.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} required>
                        <option value="">Select...</option>
                        <option value="Steel Bolt M8">Steel Bolt M8</option>
                        <option value="Aluminum Sheet 2mm">Aluminum Sheet 2mm</option>
                        <option value="Bearing SKF 6205">Bearing SKF 6205</option>
                        <option value="Copper Wire 2.5mm">Copper Wire 2.5mm</option>
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
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
