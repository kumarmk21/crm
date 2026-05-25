import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Layers, ClipboardList, CheckCircle,
  ShoppingCart, Users, FileText, DollarSign, Truck
} from 'lucide-react'

const navItems = [
  { section: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' }
  ]},
  { section: 'Operations', items: [
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/bom', icon: Layers, label: 'Bill of Materials' },
    { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
    { to: '/quality', icon: CheckCircle, label: 'Quality Control' },
    { to: '/purchase-orders', icon: Truck, label: 'Purchase Orders' }
  ]},
  { section: 'Sales', items: [
    { to: '/crm', icon: Users, label: 'CRM' },
    { to: '/sales', icon: ShoppingCart, label: 'Sales Orders' },
    { to: '/invoices', icon: FileText, label: 'Invoices' }
  ]},
  { section: 'Finance', items: [
    { to: '/finance', icon: DollarSign, label: 'Finance' }
  ]}
]

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>ManuERP</h1>
          <p>Manufacturing ERP System</p>
        </div>
        <nav>
          {navItems.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
