import { useState } from 'react'
import { Plus, X, DollarSign } from 'lucide-react'

const MOCK_PIPELINE = {
  lead: [
    { id: '1', title: 'Bulk Motor Order', customers: { company_name: 'AutoTech Inc' }, value: 85000, probability: 20, expected_close_date: '2026-07-15' },
    { id: '2', title: 'Pump Supply Contract', customers: { company_name: 'HydroForce Ltd' }, value: 120000, probability: 15, expected_close_date: '2026-08-01' },
  ],
  quotation: [
    { id: '3', title: 'Assembly Line Components', customers: { company_name: 'MegaMfg Corp' }, value: 67000, probability: 40, expected_close_date: '2026-06-30' },
  ],
  negotiation: [
    { id: '4', title: 'Annual Parts Supply', customers: { company_name: 'Acme Corp' }, value: 250000, probability: 65, expected_close_date: '2026-06-15' },
    { id: '5', title: 'Custom Motor Build', customers: { company_name: 'TechFlow Inc' }, value: 45000, probability: 70, expected_close_date: '2026-06-10' },
  ],
  won: [
    { id: '6', title: 'Q1 Bolt Supply', customers: { company_name: 'Delta Systems' }, value: 32000, probability: 100, expected_close_date: '2026-05-01' },
    { id: '7', title: 'Motor Replacement', customers: { company_name: 'StarLight Ltd' }, value: 18500, probability: 100, expected_close_date: '2026-05-10' },
  ],
  lost: [
    { id: '8', title: 'Gear Assembly Deal', customers: { company_name: 'RiverTech Co' }, value: 95000, probability: 0, expected_close_date: '2026-04-20' },
  ]
}

const STAGES = ['lead', 'quotation', 'negotiation', 'won', 'lost']
const STAGE_LABELS = { lead: 'Lead', quotation: 'Quotation', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' }

export default function CRMPage() {
  const [pipeline, setPipeline] = useState(MOCK_PIPELINE)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', company: '', value: '', probability: 20, expected_close_date: '', stage: 'lead' })

  const totalPipeline = STAGES.slice(0, 3).reduce((sum, stage) => sum + pipeline[stage].reduce((s, d) => s + d.value, 0), 0)
  const totalWon = pipeline.won.reduce((s, d) => s + d.value, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newDeal = {
      id: String(Date.now()),
      title: formData.title,
      customers: { company_name: formData.company },
      value: Number(formData.value),
      probability: Number(formData.probability),
      expected_close_date: formData.expected_close_date
    }
    setPipeline({ ...pipeline, [formData.stage]: [newDeal, ...pipeline[formData.stage]] })
    setShowModal(false)
    setFormData({ title: '', company: '', value: '', probability: 20, expected_close_date: '', stage: 'lead' })
  }

  const moveDeal = (dealId, fromStage, toStage) => {
    const deal = pipeline[fromStage].find(d => d.id === dealId)
    if (!deal) return
    setPipeline({
      ...pipeline,
      [fromStage]: pipeline[fromStage].filter(d => d.id !== dealId),
      [toStage]: [deal, ...pipeline[toStage]]
    })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>CRM Pipeline</h2>
          <p>Track deals from lead to close</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">${(totalPipeline / 1000).toFixed(0)}k</div>
          <div className="stat-label">Pipeline Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>${(totalWon / 1000).toFixed(0)}k</div>
          <div className="stat-label">Won This Period</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{STAGES.slice(0, 3).reduce((s, stage) => s + pipeline[stage].length, 0)}</div>
          <div className="stat-label">Active Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pipeline.won.length + pipeline.lost.length > 0 ? Math.round(pipeline.won.length / (pipeline.won.length + pipeline.lost.length) * 100) : 0}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
      </div>

      <div className="pipeline-board">
        {STAGES.map(stage => (
          <div key={stage} className="pipeline-column">
            <div className={`pipeline-column-header ${stage}`}>
              {STAGE_LABELS[stage]} ({pipeline[stage].length})
            </div>
            <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0 0 var(--radius) var(--radius)', minHeight: '300px' }}>
              {pipeline[stage].map(deal => (
                <div key={deal.id} className="kanban-card">
                  <h5>{deal.title}</h5>
                  <p>{deal.customers.company_name}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600, marginTop: '0.25rem' }}>
                    <DollarSign size={12} />{deal.value.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.7rem' }}>Close: {deal.expected_close_date} | {deal.probability}%</p>
                  {stage !== 'won' && stage !== 'lost' && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                      {STAGES.indexOf(stage) < 3 && (
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.7rem' }}
                          onClick={() => moveDeal(deal.id, stage, STAGES[STAGES.indexOf(stage) + 1])}>
                          Advance →
                        </button>
                      )}
                      {stage !== 'lost' && (
                        <button className="btn btn-sm" style={{ flex: 0, background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}
                          onClick={() => moveDeal(deal.id, stage, 'lost')}>
                          Lost
                        </button>
                      )}
                    </div>
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
              <h3>New Deal</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Deal Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Annual Parts Supply" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <select value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                    <option value="lead">Lead</option>
                    <option value="quotation">Quotation</option>
                    <option value="negotiation">Negotiation</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Value ($)</label>
                  <input type="number" min="0" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Probability (%)</label>
                  <input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({...formData, probability: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Expected Close</label>
                  <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
