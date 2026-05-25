import { useState } from 'react'
import { Package, AlertTriangle, Plus, RefreshCw } from 'lucide-react'

const MOCK_INVENTORY = [
  { id: '1', products: { sku: 'RM-001', name: 'Steel Bolt M8', type: 'raw_material', reorder_point: 100, unit_cost: 0.45 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 45, quantity_reserved: 10 },
  { id: '2', products: { sku: 'RM-012', name: 'Aluminum Sheet 2mm', type: 'raw_material', reorder_point: 50, unit_cost: 12.50 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 12, quantity_reserved: 5 },
  { id: '3', products: { sku: 'FG-001', name: 'Hydraulic Pump Assembly', type: 'finished_good', reorder_point: 10, unit_cost: 450.00 }, warehouses: { name: 'Finished Goods', code: 'WH-02' }, quantity_on_hand: 28, quantity_reserved: 8 },
  { id: '4', products: { sku: 'SA-005', name: 'Gear Box Sub-Assembly', type: 'sub_assembly', reorder_point: 15, unit_cost: 180.00 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 34, quantity_reserved: 12 },
  { id: '5', products: { sku: 'RM-034', name: 'Bearing SKF 6205', type: 'raw_material', reorder_point: 25, unit_cost: 8.75 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 8, quantity_reserved: 3 },
  { id: '6', products: { sku: 'FG-002', name: 'Electric Motor 5HP', type: 'finished_good', reorder_point: 5, unit_cost: 890.00 }, warehouses: { name: 'Finished Goods', code: 'WH-02' }, quantity_on_hand: 15, quantity_reserved: 4 },
  { id: '7', products: { sku: 'RM-045', name: 'Copper Wire 2.5mm', type: 'raw_material', reorder_point: 200, unit_cost: 2.30 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 520, quantity_reserved: 0 },
  { id: '8', products: { sku: 'CON-001', name: 'Lubricant Oil 5L', type: 'consumable', reorder_point: 20, unit_cost: 15.00 }, warehouses: { name: 'Main Warehouse', code: 'WH-01' }, quantity_on_hand: 42, quantity_reserved: 0 },
]

function getTypeLabel(type) {
  const labels = { raw_material: 'Raw Material', finished_good: 'Finished Good', sub_assembly: 'Sub-Assembly', consumable: 'Consumable' }
  return labels[type] || type
}

function getTypeBadge(type) {
  const colors = { raw_material: 'info', finished_good: 'success', sub_assembly: 'warning', consumable: 'neutral' }
  return <span className={`badge ${colors[type] || 'neutral'}`}>{getTypeLabel(type)}</span>
}

export default function InventoryPage() {
  const [inventory] = useState(MOCK_INVENTORY)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = inventory.filter(item => {
    const matchesFilter = filter === 'all' || item.products.type === filter
    || (filter === 'low_stock' && item.quantity_on_hand <= item.products.reorder_point)
    const matchesSearch = !search || item.products.name.toLowerCase().includes(search.toLowerCase())
      || item.products.sku.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const lowStockCount = inventory.filter(i => i.quantity_on_hand <= i.products.reorder_point).length

  return (
    <div>
      <div className="page-header">
        <h2>Inventory Management</h2>
        <p>Real-time stock tracking and reorder management</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{inventory.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{lowStockCount}</div>
          <div className="stat-label">Low Stock Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inventory.reduce((s, i) => s + i.quantity_on_hand, 0).toLocaleString()}</div>
          <div className="stat-label">Total Units</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${inventory.reduce((s, i) => s + (i.quantity_on_hand * i.products.unit_cost), 0).toLocaleString()}</div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem', width: '250px' }}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem' }}>
              <option value="all">All Types</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_good">Finished Goods</option>
              <option value="sub_assembly">Sub-Assemblies</option>
              <option value="consumable">Consumables</option>
              <option value="low_stock">Low Stock Only</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Check Reorder</button>
            <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Item</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Stock Level</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Reorder Point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const available = item.quantity_on_hand - item.quantity_reserved
                const isLow = item.quantity_on_hand <= item.products.reorder_point
                return (
                  <tr key={item.id}>
                    <td><code>{item.products.sku}</code></td>
                    <td><strong>{item.products.name}</strong></td>
                    <td>{getTypeBadge(item.products.type)}</td>
                    <td>{item.warehouses.name}</td>
                    <td>{item.quantity_on_hand}</td>
                    <td>{item.quantity_reserved}</td>
                    <td>{available}</td>
                    <td>{item.products.reorder_point}</td>
                    <td>
                      {isLow ? (
                        <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge success">In Stock</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
