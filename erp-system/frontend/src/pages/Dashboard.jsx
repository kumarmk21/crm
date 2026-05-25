import { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, Package, TrendingDown, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const MOCK_KPIS = {
  totalRevenue: 1284500,
  pendingOrders: 23,
  inventoryValue: 567800,
  monthlyExpenses: 89200
}

const MOCK_ORDERS = [
  { id: 1, so_number: 'SO-00001', customers: { company_name: 'Acme Corp' }, status: 'confirmed', total_amount: 15000, created_at: '2026-05-20' },
  { id: 2, so_number: 'SO-00002', customers: { company_name: 'TechFlow Inc' }, status: 'processing', total_amount: 28500, created_at: '2026-05-19' },
  { id: 3, so_number: 'SO-00003', customers: { company_name: 'Global Mfg' }, status: 'draft', total_amount: 7200, created_at: '2026-05-18' },
  { id: 4, so_number: 'SO-00004', customers: { company_name: 'StarLight Ltd' }, status: 'shipped', total_amount: 42000, created_at: '2026-05-17' },
  { id: 5, so_number: 'SO-00005', customers: { company_name: 'Delta Systems' }, status: 'confirmed', total_amount: 19800, created_at: '2026-05-16' },
]

const MOCK_ALERTS = [
  { id: 1, products: { name: 'Steel Bolt M8', sku: 'RM-001' }, message: 'Stock below reorder point. Current: 45, Reorder at: 100' },
  { id: 2, products: { name: 'Aluminum Sheet 2mm', sku: 'RM-012' }, message: 'Stock below reorder point. Current: 12, Reorder at: 50' },
  { id: 3, products: { name: 'Bearing SKF 6205', sku: 'RM-034' }, message: 'Stock below reorder point. Current: 8, Reorder at: 25' },
]

const REVENUE_DATA = [
  { month: 'Jan', revenue: 185000, expenses: 72000 },
  { month: 'Feb', revenue: 195000, expenses: 68000 },
  { month: 'Mar', revenue: 220000, expenses: 85000 },
  { month: 'Apr', revenue: 210000, expenses: 78000 },
  { month: 'May', revenue: 248000, expenses: 89000 },
  { month: 'Jun', revenue: 226500, expenses: 82000 }
]

const INVENTORY_DIST = [
  { name: 'Raw Materials', value: 245000 },
  { name: 'Finished Goods', value: 198000 },
  { name: 'Sub-assemblies', value: 89000 },
  { name: 'Consumables', value: 35800 }
]

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
}

function getStatusBadge(status) {
  const map = {
    draft: 'neutral', confirmed: 'info', processing: 'warning', shipped: 'success', delivered: 'success', cancelled: 'danger'
  }
  return <span className={`badge ${map[status] || 'neutral'}`}>{status}</span>
}

export default function Dashboard() {
  const [kpis] = useState(MOCK_KPIS)
  const [orders] = useState(MOCK_ORDERS)
  const [alerts] = useState(MOCK_ALERTS)

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Real-time overview of business performance</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon revenue"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <h4>Total Revenue</h4>
            <div className="kpi-value">{formatCurrency(kpis.totalRevenue)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orders"><ShoppingCart size={24} /></div>
          <div className="kpi-content">
            <h4>Pending Orders</h4>
            <div className="kpi-value">{kpis.pendingOrders}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon inventory"><Package size={24} /></div>
          <div className="kpi-content">
            <h4>Inventory Value</h4>
            <div className="kpi-value">{formatCurrency(kpis.inventoryValue)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon expenses"><TrendingDown size={24} /></div>
          <div className="kpi-content">
            <h4>Monthly Expenses</h4>
            <div className="kpi-value">{formatCurrency(kpis.monthlyExpenses)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Revenue vs Expenses</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Inventory Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={INVENTORY_DIST} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {INVENTORY_DIST.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Sales Orders</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.so_number}</strong></td>
                    <td>{order.customers.company_name}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Inventory Alerts</h3>
            <AlertTriangle size={18} color="#d97706" />
          </div>
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              <AlertTriangle size={16} />
              <div>
                <p><strong>{alert.products.name}</strong> ({alert.products.sku})</p>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
