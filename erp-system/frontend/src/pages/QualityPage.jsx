import { useState } from 'react'
import { Plus, X, CheckCircle, XCircle } from 'lucide-react'

const MOCK_CHECKS = [
  { id: '1', work_orders: { order_number: 'WO-00004', products: { name: 'Steel Bolt M8', sku: 'RM-001' } }, inspector: { first_name: 'Lisa', last_name: 'Park' }, batch_number: 'B-2026-051', quantity_inspected: 200, quantity_passed: 195, quantity_failed: 5, result: 'pass', checked_at: '2026-05-22T10:30:00' },
  { id: '2', work_orders: { order_number: 'WO-00005', products: { name: 'Hydraulic Pump Assembly', sku: 'FG-001' } }, inspector: { first_name: 'John', last_name: 'Smith' }, batch_number: 'B-2026-048', quantity_inspected: 30, quantity_passed: 28, quantity_failed: 2, result: 'pass', checked_at: '2026-05-15T14:00:00' },
  { id: '3', work_orders: { order_number: 'WO-00003', products: { name: 'Gear Box Sub-Assembly', sku: 'SA-005' } }, inspector: { first_name: 'Mike', last_name: 'Chen' }, batch_number: 'B-2026-045', quantity_inspected: 50, quantity_passed: 20, quantity_failed: 30, result: 'fail', defect_description: 'Gear alignment issues in 60% of units', checked_at: '2026-05-12T09:15:00' },
]

const MOCK_STATS = { totalInspections: 12, totalInspected: 1450, totalPassed: 1380, totalFailed: 70, passRate: '95.2' }

export default function QualityPage() {
  const [checks, setChecks] = useState(MOCK_CHECKS)
  const [stats] = useState(MOCK_STATS)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    work_order: '', batch_number: '', inspector: '',
    quantity_inspected: '', quantity_passed: '', quantity_failed: '',
    result: 'pass', defect_description: '', notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newCheck = {
      id: String(Date.now()),
      work_orders: { order_number: formData.work_order, products: { name: 'Product', sku: 'SKU' } },
      inspector: { first_name: formData.inspector.split(' ')[0], last_name: formData.inspector.split(' ')[1] || '' },
      batch_number: formData.batch_number,
      quantity_inspected: Number(formData.quantity_inspected),
      quantity_passed: Number(formData.quantity_passed),
      quantity_failed: Number(formData.quantity_failed),
      result: formData.result,
      defect_description: formData.defect_description,
      checked_at: new Date().toISOString()
    }
    setChecks([newCheck, ...checks])
    setShowModal(false)
    setFormData({ work_order: '', batch_number: '', inspector: '', quantity_inspected: '', quantity_passed: '', quantity_failed: '', result: 'pass', defect_description: '', notes: '' })
  }

  return (
    <div>
      <div className="page-header">
        <h2>Quality Control</h2>
        <p>Inspect and log pass/fail metrics for completed batches</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalInspections}</div>
          <div className="stat-label">Total Inspections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalInspected.toLocaleString()}</div>
          <div className="stat-label">Units Inspected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalPassed.toLocaleString()}</div>
          <div className="stat-label">Units Passed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.totalFailed}</div>
          <div className="stat-label">Units Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.passRate}%</div>
          <div className="stat-label">Pass Rate</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Quality Inspections</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Log Inspection
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Product</th>
                <th>Batch #</th>
                <th>Inspector</th>
                <th>Inspected</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {checks.map(check => (
                <tr key={check.id}>
                  <td><strong>{check.work_orders?.order_number}</strong></td>
                  <td>{check.work_orders?.products?.name}</td>
                  <td><code>{check.batch_number}</code></td>
                  <td>{check.inspector?.first_name} {check.inspector?.last_name}</td>
                  <td>{check.quantity_inspected}</td>
                  <td style={{ color: 'var(--success)' }}>{check.quantity_passed}</td>
                  <td style={{ color: 'var(--danger)' }}>{check.quantity_failed}</td>
                  <td>
                    {check.result === 'pass' ? (
                      <span className="badge success"><CheckCircle size={10} /> Pass</span>
                    ) : (
                      <span className="badge danger"><XCircle size={10} /> Fail</span>
                    )}
                  </td>
                  <td>{new Date(check.checked_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Quality Inspection</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Work Order</label>
                  <select value={formData.work_order} onChange={(e) => setFormData({...formData, work_order: e.target.value})} required>
                    <option value="">Select work order...</option>
                    <option value="WO-00003">WO-00003 - Gear Box Sub-Assembly</option>
                    <option value="WO-00004">WO-00004 - Steel Bolt M8</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input type="text" value={formData.batch_number} onChange={(e) => setFormData({...formData, batch_number: e.target.value})} required placeholder="e.g., B-2026-052" />
                </div>
              </div>
              <div className="form-group">
                <label>Inspector Name</label>
                <input type="text" value={formData.inspector} onChange={(e) => setFormData({...formData, inspector: e.target.value})} required placeholder="Full name" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Qty Inspected</label>
                  <input type="number" min="1" value={formData.quantity_inspected} onChange={(e) => setFormData({...formData, quantity_inspected: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Qty Passed</label>
                  <input type="number" min="0" value={formData.quantity_passed} onChange={(e) => setFormData({...formData, quantity_passed: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Qty Failed</label>
                  <input type="number" min="0" value={formData.quantity_failed} onChange={(e) => setFormData({...formData, quantity_failed: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Result</label>
                <select value={formData.result} onChange={(e) => setFormData({...formData, result: e.target.value})}>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              {formData.result !== 'pass' && (
                <div className="form-group">
                  <label>Defect Description</label>
                  <textarea rows="3" value={formData.defect_description} onChange={(e) => setFormData({...formData, defect_description: e.target.value})} placeholder="Describe defects found..." />
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
