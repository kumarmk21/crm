const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.headers.get('content-type')?.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export const dashboardApi = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getAlerts: () => api.get('/dashboard/inventory-alerts')
};

export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getAlerts: () => api.get('/inventory/alerts'),
  checkReorder: () => api.post('/inventory/check-reorder'),
  suggestPO: (data) => api.post('/inventory/suggest-po', data),
  update: (id, data) => api.put(`/inventory/${id}`, data)
};

export const bomApi = {
  getAll: () => api.get('/bom'),
  getById: (id) => api.get(`/bom/${id}`),
  create: (data) => api.post('/bom', data),
  update: (id, data) => api.put(`/bom/${id}`, data),
  delete: (id) => api.delete(`/bom/${id}`)
};

export const workOrderApi = {
  getAll: () => api.get('/work-orders'),
  getKanban: () => api.get('/work-orders/kanban'),
  create: (data) => api.post('/work-orders', data),
  updateStatus: (id, status) => api.put(`/work-orders/${id}/status`, { status }),
  update: (id, data) => api.put(`/work-orders/${id}`, data)
};

export const qualityApi = {
  getAll: () => api.get('/quality'),
  create: (data) => api.post('/quality', data),
  getStats: () => api.get('/quality/stats')
};

export const salesApi = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  confirm: (id) => api.put(`/sales/${id}/confirm`),
  updateStatus: (id, status) => api.put(`/sales/${id}/status`, { status })
};

export const crmApi = {
  getAll: () => api.get('/crm'),
  getPipeline: () => api.get('/crm/pipeline'),
  create: (data) => api.post('/crm', data),
  update: (id, data) => api.put(`/crm/${id}`, data),
  updateStage: (id, stage) => api.put(`/crm/${id}/stage`, { stage }),
  delete: (id) => api.delete(`/crm/${id}`)
};

export const invoiceApi = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  generate: (data) => api.post('/invoices/generate', data),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`),
  pay: (id, amount) => api.put(`/invoices/${id}/pay`, { amount })
};

export const financeApi = {
  getChartOfAccounts: () => api.get('/finance/chart-of-accounts'),
  getJournalEntries: () => api.get('/finance/journal-entries'),
  createJournalEntry: (data) => api.post('/finance/journal-entries', data),
  getAccountsPayable: () => api.get('/finance/accounts-payable'),
  getAccountsReceivable: () => api.get('/finance/accounts-receivable'),
  getIncomeStatement: (params) => api.get(`/finance/income-statement?${new URLSearchParams(params)}`),
  getBalanceSheet: () => api.get('/finance/balance-sheet'),
  getCashFlow: (params) => api.get(`/finance/cash-flow?${new URLSearchParams(params)}`)
};

export const purchaseOrderApi = {
  getAll: () => api.get('/purchase-orders'),
  create: (data) => api.post('/purchase-orders', data),
  approve: (id) => api.put(`/purchase-orders/${id}/approve`),
  receive: (id) => api.put(`/purchase-orders/${id}/receive`)
};

export const employeeApi = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data)
};

export const customerApi = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  deactivate: (id) => api.delete(`/customers/${id}`)
};

export const supplierApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data)
};

export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data)
};
