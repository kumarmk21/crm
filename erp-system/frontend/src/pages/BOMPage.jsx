import { useState } from 'react'
import { Plus, Layers, Trash2, X } from 'lucide-react'

const MOCK_PRODUCTS = [
  { id: 'p1', sku: 'FG-001', name: 'Hydraulic Pump Assembly', type: 'finished_good' },
  { id: 'p2', sku: 'FG-002', name: 'Electric Motor 5HP', type: 'finished_good' },
  { id: 'p3', sku: 'SA-005', name: 'Gear Box Sub-Assembly', type: 'sub_assembly' },
  { id: 'p4', sku: 'RM-001', name: 'Steel Bolt M8', type: 'raw_material' },
  { id: 'p5', sku: 'RM-012', name: 'Aluminum Sheet 2mm', type: 'raw_material' },
  { id: 'p6', sku: 'RM-034', name: 'Bearing SKF 6205', type: 'raw_material' },
  { id: 'p7', sku: 'RM-045', name: 'Copper Wire 2.5mm', type: 'raw_material' },
]

const MOCK_BOMS = [
  {
    id: 'b1', name: 'Hydraulic Pump BOM', version: '2.1',
    products: { name: 'Hydraulic Pump Assembly', sku: 'FG-001' },
    bom_lines: [
      { id: 'l1', quantity: 8, component: { name: 'Steel Bolt M8', sku: 'RM-001', type: 'raw_material', unit_cost: 0.45 } },
      { id: 'l2', quantity: 2, component: { name: 'Aluminum Sheet 2mm', sku: 'RM-012', type: 'raw_material', unit_cost: 12.50 } },
      { id: 'l3', quantity: 4, component: { name: 'Bearing SKF 6205', sku: 'RM-034', type: 'raw_material', unit_cost: 8.75 } },
      { id: 'l4', quantity: 1, component: { name: 'Gear Box Sub-Assembly', sku: 'SA-005', type: 'sub_assembly', unit_cost: 180.00 } }
    ]
  },
  {
    id: 'b2', name: 'Electric Motor BOM', version: '1.0',
    products: { name: 'Electric Motor 5HP', sku: 'FG-002' },
    bom_lines: [
      { id: 'l5', quantity: 15, component: { name: 'Copper Wire 2.5mm', sku: 'RM-045', type: 'raw_material', unit_cost: 2.30 } },
      { id: 'l6', quantity: 4, component: { name: 'Bearing SKF 6205', sku: 'RM-034', type: 'raw_material', unit_cost: 8.75 } },
      { id: 'l7', quantity: 6, component: { name: 'Steel Bolt M8', sku: 'RM-001', type: 'raw_material', unit_cost: 0.45 } }
    ]
  }
]

export default function BOMPage() {
  const [boms, setBoms] = useState(MOCK_BOMS)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ product_id: '', name: '', version: '1.0', notes: '' })
  const [lines, setLines] = useState([])
  const [expandedBom, setExpandedBom] = useState(null)

  const addLine = () => {
    setLines([...lines, { component_id: '', quantity: 1, unit_of_measure: 'pcs' }])
  }

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index, field, value) => {
    const updated = [...lines]
    updated[index][field] = value
    setLines(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const product = MOCK_PRODUCTS.find(p => p.id === formData.product_id)
    const newBom = {
      id: `b${Date.now()}`,
      name: formData.name,
      version: formData.version,
      products: product ? { name: product.name, sku: product.sku } : {},
      bom_lines: lines.map((line, i) => {
        const comp = MOCK_PRODUCTS.find(p => p.id === line.component_id)
        return {
          id: `l${Date.now()}-${i}`,
          quantity: line.quantity,
          component: comp ? { name: comp.name, sku: comp.sku, type: comp.type, unit_cost: 0 } : {}
        }
      })
    }
    setBoms([newBom, ...boms])
    setShowModal(false)
    setFormData({ product_id: '', name: '', version: '1.0', notes: '' })
    setLines([])
  }

  const getTotalCost = (bomLines) =>
    bomLines.reduce((sum, l) => sum + (l.quantity * (l.component?.unit_cost || 0)), 0)

  return (
    <div>
      <div className="page-header">
        <h2>Bill of Materials</h2>
        <p>Define product composition with sub-assemblies and raw materials</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>BOMs ({boms.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create BOM
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>BOM Name</th>
                <th>Version</th>
                <th>Components</th>
                <th>Est. Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boms.map(bom => (
                <>
                  <tr key={bom.id}>
                    <td><strong>{bom.products?.name}</strong><br/><small style={{color:'var(--text-muted)'}}>{bom.products?.sku}</small></td>
                    <td>{bom.name}</td>
                    <td><span className="badge info">v{bom.version}</span></td>
                    <td>{bom.bom_lines.length} items</td>
                    <td>${getTotalCost(bom.bom_lines).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpandedBom(expandedBom === bom.id ? null : bom.id)}>
                        {expandedBom === bom.id ? 'Collapse' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                  {expandedBom === bom.id && (
                    <tr key={`${bom.id}-detail`}>
                      <td colSpan={6} style={{ background: '#f8fafc', padding: '1rem' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Component</th>
                              <th>SKU</th>
                              <th>Type</th>
                              <th>Quantity</th>
                              <th>Unit Cost</th>
                              <th>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bom.bom_lines.map(line => (
                              <tr key={line.id}>
                                <td>{line.component?.name}</td>
                                <td><code>{line.component?.sku}</code></td>
                                <td><span className={`badge ${line.component?.type === 'sub_assembly' ? 'warning' : 'info'}`}>{line.component?.type?.replace('_', ' ')}</span></td>
                                <td>{line.quantity}</td>
                                <td>${(line.component?.unit_cost || 0).toFixed(2)}</td>
                                <td>${(line.quantity * (line.component?.unit_cost || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Create Bill of Materials</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Finished Product</label>
                  <select value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required>
                    <option value="">Select product...</option>
                    {MOCK_PRODUCTS.filter(p => p.type === 'finished_good').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>BOM Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Main Assembly BOM" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Version</label>
                  <input type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes" />
                </div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Components</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={12} /> Add Component</button>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <label>Component</label>
                      <select value={line.component_id} onChange={(e) => updateLine(idx, 'component_id', e.target.value)} required>
                        <option value="">Select...</option>
                        {MOCK_PRODUCTS.filter(p => p.type !== 'finished_good').map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))} required />
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(idx)} style={{ marginBottom: '0' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {lines.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No components added yet. Click "Add Component" to start.</p>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
