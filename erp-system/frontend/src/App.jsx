import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import InventoryPage from './pages/InventoryPage'
import BOMPage from './pages/BOMPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import QualityPage from './pages/QualityPage'
import SalesPage from './pages/SalesPage'
import CRMPage from './pages/CRMPage'
import InvoicesPage from './pages/InvoicesPage'
import FinancePage from './pages/FinancePage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/bom" element={<BOMPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      </Routes>
    </Layout>
  )
}

export default App
