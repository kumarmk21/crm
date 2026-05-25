import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'

const MOCK_KANBAN = {
  planned: [
    { id: 'wo1', order_number: 'WO-00001', quantity: 50, products: { name: 'Hydraulic Pump Assembly', sku: 'FG-001' }, assigned: { first_name: 'John', last_name: 'Smith' }, planned_start: '2026-05-26', planned_end: '2026-05-30' },
    { id: 'wo2', order_number: 'WO-00002', quantity: 100, products: { name: 'Electric Motor 5HP', sku: 'FG-002' }, assigned: { first_name: 'Sarah', last_name: 'Jones' }, planned_start: '2026-05-27', planned_end: '2026-06-02' },
  ],
  in_production: [
    { id: 'wo3', order_number: 'WO-00003', quantity: 75, products: { name: 'Gear Box Sub-Assembly', sku: 'SA-005' }, assigned: { first_name: 'Mike', last_name: 'Chen' }, planned_start: '2026-05-20', planned_end: '2026-05-25' },
  ],
  quality_check: [
    { id: 'wo4', order_number: 'WO-00004', quantity: 200, products: { name: 'Steel Bolt M8', sku: 'RM-001' }, assigned: { first_name: 'Lisa', last_name: 'Park' }, planned_start: '2026-05-18', planned_end: '2026-05-22' },
  ],
  completed: [
    { id: 'wo5', order_number: 'WO-00005', quantity: 30, products: { name: 'Hydraulic Pump Assembly', sku: 'FG-001' }, assigned: { first_name: 'John', last_name: 'Smith' }, planned_start: '2026-05-10', planned_end: '2026-05-15' },
  ]
}

const STATUSES = ['planned', 'in_production', 'quality_check', 'completed']

const STATUS_LABELS = {
  planned: 'Planned',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  completed: 'Completed'
}

const STATUS_COLORS = {
  planned: '#6366f1',
  in_production: '#f59e0b',
  quality_check: '#8b5cf6',
  completed: '#10b981'
}

export default function WorkOrdersPage() {
  const [kanban, setKanban] = useState(MOCK_KANBAN)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ product: '', quantity: '', assigned: '', planned_start: '', planned_end: '' })

  const moveCard = (cardId, fromStatus, toStatus) => {
    const fromIdx = STATUSES.indexOf(fromStatus)
    const toIdx = STATUSES.indexOf(toStatus)
    if (toIdx !== fromIdx + 1) return

    const card = kanban[fromStatus].find(c => c.id === cardId)
    if (!card) return

    setKanban({
      ...kanban,
      [fromStatus]: kanban[fromStatus].filter(c => c.id !== cardId),
      [toStatus]: [...kanban[toStatus], card]
    })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    const newOrder = {
      id: `wo${Date.now()}`,
      order_number: `WO-${String(Object.values(kanban).flat().length + 1).padStart(5, '0')}`,
      quantity: Number(formData.quantity),
      products: { name: formData.product, sku: 'NEW' },
      assigned: { first_name: formData.assigned.split(' ')[0] || '', last_name: formData.assigned.split(' ')[1] || '' },
      planned_start: formData.planned_start,
      planned_end: formData.planned_end
    }
    setKanban({ ...kanban, planned: [newOrder, ...kanban.planned] })
    setShowModal(false)
    setFormData({ product: '', quantity: '', assigned: '', planned_start: '', planned_end: '' })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Work Orders</h2>
          <p>Kanban board for manufacturing workflow</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Work Order
        </button>
      </div>

      <div className="kanban-board">
        {STATUSES.map(status => (
          <div key={status} className="kanban-column">
            <div className="kanban-column-header">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }}></span>
                {STATUS_LABELS[status]}
              </h4>
              <span className="count">{kanban[status].length}</span>
            </div>
            <div style={{ minHeight: '200px' }}>
              {kanban[status].map(card => (
                <div key={card.id} className="kanban-card">
                  <h5>{card.order_number}</h5>
                  <p>{card.products.name}</p>
                  <p>Qty: {card.quantity} | {card.assigned?.first_name} {card.assigned?.last_name}</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>{card.planned_start} → {card.planned_end}</p>
                  {status !== 'completed' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => moveCard(card.id, status, STATUSES[STATUSES.indexOf(status) + 1])}
                    >
                      Move to {STATUS_LABELS[STATUSES[STATUSES.indexOf(status) + 1]]} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Work Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Product</label>
                <select value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} required>
                  <option value="">Select product...</option>
                  <option value="Hydraulic Pump Assembly">Hydraulic Pump Assembly</option>
                  <option value="Electric Motor 5HP">Electric Motor 5HP</option>
                  <option value="Gear Box Sub-Assembly">Gear Box Sub-Assembly</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input type="text" value={formData.assigned} onChange={(e) => setFormData({...formData, assigned: e.target.value})} placeholder="Name" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Planned Start</label>
                  <input type="date" value={formData.planned_start} onChange={(e) => setFormData({...formData, planned_start: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Planned End</label>
                  <input type="date" value={formData.planned_end} onChange={(e) => setFormData({...formData, planned_end: e.target.value})} required />
                </div>
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
