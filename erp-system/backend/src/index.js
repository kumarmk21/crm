const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const bomRoutes = require('./routes/bom');
const workOrderRoutes = require('./routes/workOrders');
const qualityRoutes = require('./routes/quality');
const salesRoutes = require('./routes/sales');
const crmRoutes = require('./routes/crm');
const invoiceRoutes = require('./routes/invoices');
const financeRoutes = require('./routes/finance');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const employeeRoutes = require('./routes/employees');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const warehouseRoutes = require('./routes/warehouses');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ERP Backend running on port ${PORT}`);
});

module.exports = app;
