export type Role =
  | 'admin'
  | 'sales'
  | 'operations'
  | 'warehouse_manager'
  | 'accountant'

export type Permission =
  | 'dashboard.view'
  | 'customers.manage'
  | 'suppliers.manage'
  | 'bom.manage'
  | 'work_orders.manage'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'purchase_orders.manage'
  | 'quality_control.log'
  | 'crm.manage'
  | 'sales_orders.manage'
  | 'invoices.manage'
  | 'ledger.view'
  | 'ledger.post'
  | 'financial_reports.view'
  | 'payments.record'

export type WorkOrderStage =
  | 'planned'
  | 'in_production'
  | 'quality_check'
  | 'completed'

export interface Product {
  id: string
  sku: string
  name: string
  kind: 'raw_material' | 'sub_assembly' | 'finished_good'
  unitCost: number
  salePrice: number
  unitOfMeasure: string
}

export interface Snapshot {
  generatedAt: string
  currentRole: Role
  grantedPermissions: Permission[]
  rbac: {
    roles: Array<{
      role: Role
      label: string
      permissions: Permission[]
    }>
  }
  dashboard: {
    totalRevenue: number
    pendingOrders: number
    inventoryValue: number
    monthlyExpenses: number
  }
  masterData: {
    customers: Array<{ id: string; name: string }>
    suppliers: Array<{ id: string; name: string }>
    products: Product[]
    warehouses: Array<{ id: string; name: string }>
    employees: Array<{ id: string; name: string; role: Role }>
  }
  operations: {
    boms: Array<{
      id: string
      productId: string
      productName: string
      revision: string
      notes: string
      lines: Array<{
        id: string
        componentProductId: string
        componentName: string
        quantity: number
      }>
    }>
    workOrders: Array<{
      id: string
      code: string
      productId: string
      productName: string
      quantity: number
      stage: WorkOrderStage
      dueDate: string
      priority: 'low' | 'medium' | 'high'
      notes: string
    }>
    inventory: Array<{
      id: string
      sku: string
      itemName: string
      stockLevel: number
      reservedStock: number
      availableStock: number
      reorderPoint: number
      location: string
      warehouseName: string
      inventoryValue: number
    }>
    alerts: Array<{
      sku: string
      itemName: string
      availableStock: number
      reorderPoint: number
      suggestedQuantity: number
      location: string
    }>
    purchaseOrders: Array<{
      id: string
      poNumber: string
      productId: string
      productName: string
      supplierName: string
      quantity: number
      unitCost: number
      status: 'draft' | 'confirmed'
      totalCost: number
      createdAt: string
    }>
    qualityLogs: Array<{
      id: string
      workOrderId: string
      workOrderCode: string
      batchCode: string
      passedUnits: number
      failedUnits: number
      notes: string
      createdAt: string
    }>
  }
  sales: {
    crmClients: Array<{
      id: string
      name: string
      contactName: string
      email: string
      stage: 'lead' | 'quotation' | 'negotiation' | 'won' | 'lost'
      estimatedValue: number
    }>
    salesOrders: Array<{
      id: string
      orderNumber: string
      clientId: string
      clientName: string
      status: 'draft' | 'confirmed' | 'invoiced' | 'paid'
      createdAt: string
      shippingAddress: string
      total: number
      lineItems: Array<{
        id: string
        productId: string
        quantity: number
        unitPrice: number
      }>
    }>
    invoices: Array<{
      id: string
      invoiceNumber: string
      salesOrderId: string
      orderNumber: string
      clientName: string
      status: 'sent' | 'paid'
      createdAt: string
      subtotal: number
      discountRate: number
      discountAmount: number
      taxRate: number
      taxAmount: number
      shippingFee: number
      total: number
      amountPaid: number
    }>
  }
  finance: {
    accounts: Array<{
      id: string
      code: string
      name: string
      category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    }>
    journalEntries: Array<{
      id: string
      memo: string
      sourceType: string
      createdAt: string
      totalDebit: number
      totalCredit: number
    }>
    accountsPayable: Array<{
      id: string
      poNumber: string
      supplierName: string
      amount: number
      status: 'draft' | 'confirmed'
      createdAt: string
    }>
    accountsReceivable: Array<{
      id: string
      invoiceNumber: string
      clientName: string
      total: number
      amountPaid: number
      outstandingAmount: number
      status: 'sent' | 'paid'
    }>
    statements: {
      incomeStatement: {
        revenue: number
        expenses: number
        netIncome: number
      }
      balanceSheet: {
        assets: number
        liabilities: number
        equity: number
      }
      cashFlow: {
        operatingCashFlow: number
        investingCashFlow: number
        financingCashFlow: number
        netCashFlow: number
      }
    }
  }
}
