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

export type ProductKind = 'raw_material' | 'sub_assembly' | 'finished_good'
export type WorkOrderStage =
  | 'planned'
  | 'in_production'
  | 'quality_check'
  | 'completed'
export type DealStage = 'lead' | 'quotation' | 'negotiation' | 'won' | 'lost'
export type SalesOrderStatus = 'draft' | 'confirmed' | 'invoiced' | 'paid'
export type PurchaseOrderStatus = 'draft' | 'confirmed'
export type InvoiceStatus = 'sent' | 'paid'
export type AccountCategory =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'

export interface Customer {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  status: 'active' | 'inactive'
}

export interface Supplier {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  leadTimeDays: number
}

export interface Product {
  id: string
  sku: string
  name: string
  kind: ProductKind
  unitCost: number
  salePrice: number
  unitOfMeasure: string
}

export interface Bom {
  id: string
  productId: string
  revision: string
  notes: string
}

export interface BomLine {
  id: string
  bomId: string
  componentProductId: string
  quantity: number
}

export interface Warehouse {
  id: string
  name: string
  code: string
  location: string
}

export interface Employee {
  id: string
  name: string
  title: string
  email: string
  role: Role
  warehouseId?: string
}

export interface InventoryRecord {
  id: string
  productId: string
  warehouseId: string
  location: string
  stockLevel: number
  reservedStock: number
  reorderPoint: number
}

export interface WorkOrder {
  id: string
  code: string
  productId: string
  quantity: number
  stage: WorkOrderStage
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  notes: string
}

export interface QualityLog {
  id: string
  workOrderId: string
  batchCode: string
  passedUnits: number
  failedUnits: number
  notes: string
  createdAt: string
}

export interface CrmClient {
  id: string
  name: string
  contactName: string
  email: string
  stage: DealStage
  estimatedValue: number
}

export interface SalesOrderLine {
  id: string
  productId: string
  quantity: number
  unitPrice: number
}

export interface SalesOrder {
  id: string
  orderNumber: string
  clientId: string
  status: SalesOrderStatus
  createdAt: string
  shippingAddress: string
  lineItems: SalesOrderLine[]
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  productId: string
  quantity: number
  unitCost: number
  status: PurchaseOrderStatus
  sourceAlertSku: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  salesOrderId: string
  status: InvoiceStatus
  createdAt: string
  subtotal: number
  discountRate: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  shippingFee: number
  total: number
  amountPaid: number
}

export interface Account {
  id: string
  code: string
  name: string
  category: AccountCategory
}

export interface JournalEntryLine {
  accountId: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  memo: string
  sourceType:
    | 'opening_balance'
    | 'expense'
    | 'purchase_order'
    | 'invoice'
    | 'payment'
    | 'manufacturing'
  sourceId: string
  createdAt: string
  lines: JournalEntryLine[]
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  createdAt: string
}

export interface ErpSeedData {
  customers: Customer[]
  suppliers: Supplier[]
  products: Product[]
  boms: Bom[]
  bomLines: BomLine[]
  warehouses: Warehouse[]
  employees: Employee[]
  inventory: InventoryRecord[]
  workOrders: WorkOrder[]
  qualityLogs: QualityLog[]
  crmClients: CrmClient[]
  salesOrders: SalesOrder[]
  purchaseOrders: PurchaseOrder[]
  invoices: Invoice[]
  accounts: Account[]
  journalEntries: JournalEntry[]
  payments: Payment[]
}

export interface DashboardMetrics {
  totalRevenue: number
  pendingOrders: number
  inventoryValue: number
  monthlyExpenses: number
}

export interface InventoryAlert {
  sku: string
  itemName: string
  availableStock: number
  reorderPoint: number
  suggestedQuantity: number
  location: string
}

export interface FinancialStatements {
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

export interface RoleDefinition {
  role: Role
  label: string
  permissions: Permission[]
}

export interface ErpSnapshot {
  generatedAt: string
  currentRole: Role
  grantedPermissions: Permission[]
  rbac: {
    roles: RoleDefinition[]
  }
  dashboard: DashboardMetrics
  masterData: {
    customers: Customer[]
    suppliers: Supplier[]
    products: Product[]
    warehouses: Warehouse[]
    employees: Employee[]
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
    workOrders: Array<WorkOrder & { productName: string }>
    inventory: Array<
      InventoryRecord & {
        sku: string
        itemName: string
        availableStock: number
        inventoryValue: number
        warehouseName: string
      }
    >
    alerts: InventoryAlert[]
    purchaseOrders: Array<
      PurchaseOrder & {
        productName: string
        supplierName: string
        totalCost: number
      }
    >
    qualityLogs: Array<QualityLog & { workOrderCode: string }>
  }
  sales: {
    crmClients: CrmClient[]
    salesOrders: Array<
      SalesOrder & {
        clientName: string
        total: number
      }
    >
    invoices: Array<
      Invoice & {
        orderNumber: string
        clientName: string
      }
    >
  }
  finance: {
    accounts: Account[]
    journalEntries: Array<
      JournalEntry & {
        totalDebit: number
        totalCredit: number
      }
    >
    accountsPayable: Array<
      PurchaseOrder & {
        supplierName: string
        amount: number
      }
    >
    accountsReceivable: Array<
      Invoice & {
        clientName: string
        outstandingAmount: number
      }
    >
    statements: FinancialStatements
  }
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'dashboard.view',
    'customers.manage',
    'suppliers.manage',
    'bom.manage',
    'work_orders.manage',
    'inventory.view',
    'inventory.adjust',
    'purchase_orders.manage',
    'quality_control.log',
    'crm.manage',
    'sales_orders.manage',
    'invoices.manage',
    'ledger.view',
    'ledger.post',
    'financial_reports.view',
    'payments.record',
  ],
  sales: [
    'dashboard.view',
    'customers.manage',
    'crm.manage',
    'sales_orders.manage',
    'invoices.manage',
  ],
  operations: [
    'dashboard.view',
    'bom.manage',
    'work_orders.manage',
    'inventory.view',
    'quality_control.log',
  ],
  warehouse_manager: [
    'dashboard.view',
    'inventory.view',
    'inventory.adjust',
    'purchase_orders.manage',
    'work_orders.manage',
  ],
  accountant: [
    'dashboard.view',
    'invoices.manage',
    'ledger.view',
    'ledger.post',
    'financial_reports.view',
    'payments.record',
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  sales: 'Sales',
  operations: 'Operations',
  warehouse_manager: 'Warehouse Manager',
  accountant: 'Accountant',
}

const WORK_ORDER_FLOW: WorkOrderStage[] = [
  'planned',
  'in_production',
  'quality_check',
  'completed',
]

const ACCOUNT_IDS = {
  cash: 'acct-cash',
  accountsReceivable: 'acct-ar',
  rawInventory: 'acct-raw',
  finishedInventory: 'acct-finished',
  accountsPayable: 'acct-ap',
  taxPayable: 'acct-tax',
  retainedEarnings: 'acct-equity',
  salesRevenue: 'acct-revenue',
  payrollExpense: 'acct-payroll',
  rentExpense: 'acct-rent',
} as const

const roundMoney = (value: number) => Math.round(value * 100) / 100

const isoDaysFromNow = (daysFromNow: number) => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

const monthKey = (value: string) => value.slice(0, 7)

const uniqueId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const stageIndex = (stage: WorkOrderStage) => WORK_ORDER_FLOW.indexOf(stage)

export const hasPermission = (role: Role, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission)

const getSalesOrderLineSubtotal = (line: SalesOrderLine) =>
  roundMoney(line.quantity * line.unitPrice)

export const createSeedData = (): ErpSeedData => {
  const customers: Customer[] = [
    {
      id: 'cust-nova',
      name: 'Nova Hydro',
      contactName: 'Priya Menon',
      email: 'priya@novahydro.example',
      phone: '+1 555-2001',
      status: 'active',
    },
    {
      id: 'cust-atlas',
      name: 'Atlas Fabrication',
      contactName: 'David Cole',
      email: 'david@atlasfab.example',
      phone: '+1 555-2002',
      status: 'active',
    },
    {
      id: 'cust-terra',
      name: 'Terra Mining',
      contactName: 'Olivia King',
      email: 'olivia@terramining.example',
      phone: '+1 555-2003',
      status: 'active',
    },
  ]

  const suppliers: Supplier[] = [
    {
      id: 'sup-allied',
      name: 'Allied Metals',
      contactName: 'Nina Patel',
      email: 'nina@alliedmetals.example',
      phone: '+1 555-3001',
      leadTimeDays: 7,
    },
    {
      id: 'sup-vector',
      name: 'Vector Components',
      contactName: 'Leo Ramos',
      email: 'leo@vectorcomponents.example',
      phone: '+1 555-3002',
      leadTimeDays: 5,
    },
  ]

  const products: Product[] = [
    {
      id: 'prod-steel',
      sku: 'RM-STEEL-01',
      name: 'Steel Sheet',
      kind: 'raw_material',
      unitCost: 18,
      salePrice: 0,
      unitOfMeasure: 'sheet',
    },
    {
      id: 'prod-bolt',
      sku: 'RM-BOLT-04',
      name: 'Fastener Kit',
      kind: 'raw_material',
      unitCost: 4,
      salePrice: 0,
      unitOfMeasure: 'kit',
    },
    {
      id: 'prod-seal',
      sku: 'RM-SEAL-01',
      name: 'Rubber Seal Set',
      kind: 'raw_material',
      unitCost: 3,
      salePrice: 0,
      unitOfMeasure: 'set',
    },
    {
      id: 'prod-motor',
      sku: 'SUB-MOTOR-02',
      name: 'Motor Core Assembly',
      kind: 'sub_assembly',
      unitCost: 120,
      salePrice: 0,
      unitOfMeasure: 'assembly',
    },
    {
      id: 'prod-pump',
      sku: 'FG-PUMP-X100',
      name: 'Industrial Pump X100',
      kind: 'finished_good',
      unitCost: 325,
      salePrice: 610,
      unitOfMeasure: 'unit',
    },
    {
      id: 'prod-panel',
      sku: 'FG-PANEL-A5',
      name: 'Control Panel A5',
      kind: 'finished_good',
      unitCost: 210,
      salePrice: 390,
      unitOfMeasure: 'unit',
    },
  ]

  const warehouses: Warehouse[] = [
    {
      id: 'wh-main',
      name: 'Main Distribution Center',
      code: 'MDC',
      location: 'Chicago, IL',
    },
    {
      id: 'wh-fab',
      name: 'Fabrication Floor',
      code: 'FAB',
      location: 'Chicago, IL',
    },
  ]

  const employees: Employee[] = [
    {
      id: 'emp-01',
      name: 'Amara Holt',
      title: 'ERP Administrator',
      email: 'amara@example.com',
      role: 'admin',
    },
    {
      id: 'emp-02',
      name: 'Ethan Ross',
      title: 'Sales Manager',
      email: 'ethan@example.com',
      role: 'sales',
    },
    {
      id: 'emp-03',
      name: 'Mila Brooks',
      title: 'Operations Lead',
      email: 'mila@example.com',
      role: 'operations',
      warehouseId: 'wh-fab',
    },
    {
      id: 'emp-04',
      name: 'Noah Reed',
      title: 'Warehouse Manager',
      email: 'noah@example.com',
      role: 'warehouse_manager',
      warehouseId: 'wh-main',
    },
    {
      id: 'emp-05',
      name: 'Ava Nguyen',
      title: 'Controller',
      email: 'ava@example.com',
      role: 'accountant',
    },
  ]

  const boms: Bom[] = [
    {
      id: 'bom-pump-r3',
      productId: 'prod-pump',
      revision: 'R3',
      notes: 'Standard pump assembly with motor, steel shell, and seal kit.',
    },
  ]

  const bomLines: BomLine[] = [
    {
      id: 'bom-line-1',
      bomId: 'bom-pump-r3',
      componentProductId: 'prod-motor',
      quantity: 1,
    },
    {
      id: 'bom-line-2',
      bomId: 'bom-pump-r3',
      componentProductId: 'prod-steel',
      quantity: 2,
    },
    {
      id: 'bom-line-3',
      bomId: 'bom-pump-r3',
      componentProductId: 'prod-bolt',
      quantity: 4,
    },
    {
      id: 'bom-line-4',
      bomId: 'bom-pump-r3',
      componentProductId: 'prod-seal',
      quantity: 1,
    },
  ]

  const inventory: InventoryRecord[] = [
    {
      id: 'inv-steel',
      productId: 'prod-steel',
      warehouseId: 'wh-main',
      location: 'Aisle A / Bin 01',
      stockLevel: 18,
      reservedStock: 0,
      reorderPoint: 24,
    },
    {
      id: 'inv-bolt',
      productId: 'prod-bolt',
      warehouseId: 'wh-main',
      location: 'Aisle A / Bin 02',
      stockLevel: 86,
      reservedStock: 0,
      reorderPoint: 40,
    },
    {
      id: 'inv-seal',
      productId: 'prod-seal',
      warehouseId: 'wh-main',
      location: 'Aisle A / Bin 04',
      stockLevel: 21,
      reservedStock: 0,
      reorderPoint: 18,
    },
    {
      id: 'inv-motor',
      productId: 'prod-motor',
      warehouseId: 'wh-fab',
      location: 'Cell 4 / Rack 1',
      stockLevel: 12,
      reservedStock: 0,
      reorderPoint: 10,
    },
    {
      id: 'inv-pump',
      productId: 'prod-pump',
      warehouseId: 'wh-fab',
      location: 'Finished Goods / Row 3',
      stockLevel: 16,
      reservedStock: 4,
      reorderPoint: 8,
    },
    {
      id: 'inv-panel',
      productId: 'prod-panel',
      warehouseId: 'wh-main',
      location: 'Finished Goods / Row 1',
      stockLevel: 11,
      reservedStock: 1,
      reorderPoint: 6,
    },
  ]

  const workOrders: WorkOrder[] = [
    {
      id: 'wo-1001',
      code: 'WO-1001',
      productId: 'prod-pump',
      quantity: 6,
      stage: 'planned',
      dueDate: isoDaysFromNow(4),
      priority: 'high',
      notes: 'Customer replenishment for Nova Hydro.',
    },
    {
      id: 'wo-1002',
      code: 'WO-1002',
      productId: 'prod-pump',
      quantity: 4,
      stage: 'in_production',
      dueDate: isoDaysFromNow(2),
      priority: 'medium',
      notes: 'Spare pump build lot.',
    },
    {
      id: 'wo-1003',
      code: 'WO-1003',
      productId: 'prod-pump',
      quantity: 5,
      stage: 'quality_check',
      dueDate: isoDaysFromNow(1),
      priority: 'high',
      notes: 'Rush job awaiting QC sign-off.',
    },
    {
      id: 'wo-1000',
      code: 'WO-1000',
      productId: 'prod-panel',
      quantity: 8,
      stage: 'completed',
      dueDate: isoDaysFromNow(-3),
      priority: 'low',
      notes: 'Completed control panel batch.',
    },
  ]

  const qualityLogs: QualityLog[] = [
    {
      id: 'qc-01',
      workOrderId: 'wo-1000',
      batchCode: 'BATCH-A5-040',
      passedUnits: 8,
      failedUnits: 0,
      notes: 'Panels passed electrical test bench.',
      createdAt: isoDaysFromNow(-3),
    },
  ]

  const crmClients: CrmClient[] = [
    {
      id: 'crm-01',
      name: 'North Ridge Energy',
      contactName: 'Cara Sloan',
      email: 'cara@northridge.example',
      stage: 'lead',
      estimatedValue: 42000,
    },
    {
      id: 'crm-02',
      name: 'Blue Harbor Utilities',
      contactName: 'Jared Poole',
      email: 'jared@blueharbor.example',
      stage: 'quotation',
      estimatedValue: 76000,
    },
    {
      id: 'crm-03',
      name: 'Atlas Fabrication',
      contactName: 'David Cole',
      email: 'david@atlasfab.example',
      stage: 'negotiation',
      estimatedValue: 21500,
    },
    {
      id: 'crm-04',
      name: 'Nova Hydro',
      contactName: 'Priya Menon',
      email: 'priya@novahydro.example',
      stage: 'won',
      estimatedValue: 58000,
    },
  ]

  const salesOrders: SalesOrder[] = [
    {
      id: 'so-0998',
      orderNumber: 'SO-0998',
      clientId: 'crm-04',
      status: 'paid',
      createdAt: isoDaysFromNow(-10),
      shippingAddress: '120 Lakefront Ave, Chicago, IL',
      lineItems: [
        {
          id: 'sol-01',
          productId: 'prod-pump',
          quantity: 5,
          unitPrice: 610,
        },
      ],
    },
    {
      id: 'so-1001',
      orderNumber: 'SO-1001',
      clientId: 'crm-03',
      status: 'confirmed',
      createdAt: isoDaysFromNow(-2),
      shippingAddress: '45 West Yard Rd, Chicago, IL',
      lineItems: [
        {
          id: 'sol-02',
          productId: 'prod-pump',
          quantity: 4,
          unitPrice: 610,
        },
      ],
    },
    {
      id: 'so-1002',
      orderNumber: 'SO-1002',
      clientId: 'crm-02',
      status: 'draft',
      createdAt: isoDaysFromNow(-1),
      shippingAddress: '89 Harbor Loop, Milwaukee, WI',
      lineItems: [
        {
          id: 'sol-03',
          productId: 'prod-panel',
          quantity: 3,
          unitPrice: 390,
        },
      ],
    },
  ]

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-901',
      poNumber: 'PO-901',
      supplierId: 'sup-allied',
      productId: 'prod-steel',
      quantity: 40,
      unitCost: 18,
      status: 'confirmed',
      sourceAlertSku: 'RM-STEEL-01',
      createdAt: isoDaysFromNow(-4),
    },
  ]

  const invoices: Invoice[] = [
    {
      id: 'inv-5001',
      invoiceNumber: 'INV-5001',
      salesOrderId: 'so-0998',
      status: 'paid',
      createdAt: isoDaysFromNow(-9),
      subtotal: 3050,
      discountRate: 0.05,
      discountAmount: 152.5,
      taxRate: 0.08,
      taxAmount: 231.8,
      shippingFee: 75,
      total: 3204.3,
      amountPaid: 3204.3,
    },
  ]

  const payments: Payment[] = [
    {
      id: 'pay-01',
      invoiceId: 'inv-5001',
      amount: 3204.3,
      createdAt: isoDaysFromNow(-8),
    },
  ]

  const accounts: Account[] = [
    { id: ACCOUNT_IDS.cash, code: '1000', name: 'Cash', category: 'asset' },
    {
      id: ACCOUNT_IDS.accountsReceivable,
      code: '1100',
      name: 'Accounts Receivable',
      category: 'asset',
    },
    {
      id: ACCOUNT_IDS.rawInventory,
      code: '1200',
      name: 'Raw Material Inventory',
      category: 'asset',
    },
    {
      id: ACCOUNT_IDS.finishedInventory,
      code: '1210',
      name: 'Finished Goods Inventory',
      category: 'asset',
    },
    {
      id: ACCOUNT_IDS.accountsPayable,
      code: '2000',
      name: 'Accounts Payable',
      category: 'liability',
    },
    {
      id: ACCOUNT_IDS.taxPayable,
      code: '2100',
      name: 'Sales Tax Payable',
      category: 'liability',
    },
    {
      id: ACCOUNT_IDS.retainedEarnings,
      code: '3000',
      name: 'Retained Earnings',
      category: 'equity',
    },
    {
      id: ACCOUNT_IDS.salesRevenue,
      code: '4000',
      name: 'Sales Revenue',
      category: 'revenue',
    },
    {
      id: ACCOUNT_IDS.payrollExpense,
      code: '5000',
      name: 'Payroll Expense',
      category: 'expense',
    },
    {
      id: ACCOUNT_IDS.rentExpense,
      code: '5100',
      name: 'Rent Expense',
      category: 'expense',
    },
  ]

  const currentMonth = new Date().toISOString().slice(0, 7)

  const journalEntries: JournalEntry[] = [
    {
      id: 'je-001',
      memo: 'Opening cash balance',
      sourceType: 'opening_balance',
      sourceId: 'opening-cash',
      createdAt: `${currentMonth}-01T09:00:00.000Z`,
      lines: [
        { accountId: ACCOUNT_IDS.cash, debit: 185000, credit: 0 },
        {
          accountId: ACCOUNT_IDS.retainedEarnings,
          debit: 0,
          credit: 185000,
        },
      ],
    },
    {
      id: 'je-002',
      memo: 'Opening inventory balance',
      sourceType: 'opening_balance',
      sourceId: 'opening-inventory',
      createdAt: `${currentMonth}-01T09:10:00.000Z`,
      lines: [
        { accountId: ACCOUNT_IDS.rawInventory, debit: 6800, credit: 0 },
        { accountId: ACCOUNT_IDS.finishedInventory, debit: 8100, credit: 0 },
        {
          accountId: ACCOUNT_IDS.retainedEarnings,
          debit: 0,
          credit: 14900,
        },
      ],
    },
    {
      id: 'je-003',
      memo: 'Monthly payroll',
      sourceType: 'expense',
      sourceId: 'expense-payroll',
      createdAt: `${currentMonth}-05T09:00:00.000Z`,
      lines: [
        { accountId: ACCOUNT_IDS.payrollExpense, debit: 18000, credit: 0 },
        { accountId: ACCOUNT_IDS.cash, debit: 0, credit: 18000 },
      ],
    },
    {
      id: 'je-004',
      memo: 'Factory rent',
      sourceType: 'expense',
      sourceId: 'expense-rent',
      createdAt: `${currentMonth}-06T09:00:00.000Z`,
      lines: [
        { accountId: ACCOUNT_IDS.rentExpense, debit: 6200, credit: 0 },
        { accountId: ACCOUNT_IDS.cash, debit: 0, credit: 6200 },
      ],
    },
    {
      id: 'je-005',
      memo: 'Confirmed purchase order PO-901',
      sourceType: 'purchase_order',
      sourceId: 'po-901',
      createdAt: isoDaysFromNow(-4),
      lines: [
        { accountId: ACCOUNT_IDS.rawInventory, debit: 720, credit: 0 },
        { accountId: ACCOUNT_IDS.accountsPayable, debit: 0, credit: 720 },
      ],
    },
    {
      id: 'je-006',
      memo: 'Invoice INV-5001 issued',
      sourceType: 'invoice',
      sourceId: 'inv-5001',
      createdAt: isoDaysFromNow(-9),
      lines: [
        {
          accountId: ACCOUNT_IDS.accountsReceivable,
          debit: 3204.3,
          credit: 0,
        },
        { accountId: ACCOUNT_IDS.salesRevenue, debit: 0, credit: 2972.5 },
        { accountId: ACCOUNT_IDS.taxPayable, debit: 0, credit: 231.8 },
      ],
    },
    {
      id: 'je-007',
      memo: 'Payment received for INV-5001',
      sourceType: 'payment',
      sourceId: 'pay-01',
      createdAt: isoDaysFromNow(-8),
      lines: [
        { accountId: ACCOUNT_IDS.cash, debit: 3204.3, credit: 0 },
        {
          accountId: ACCOUNT_IDS.accountsReceivable,
          debit: 0,
          credit: 3204.3,
        },
      ],
    },
  ]

  return {
    customers,
    suppliers,
    products,
    boms,
    bomLines,
    warehouses,
    employees,
    inventory,
    workOrders,
    qualityLogs,
    crmClients,
    salesOrders,
    purchaseOrders,
    invoices,
    accounts,
    journalEntries,
    payments,
  }
}

export class ErpStore {
  private data: ErpSeedData

  constructor(seedData: ErpSeedData = createSeedData()) {
    this.data = structuredClone(seedData)
  }

  getSnapshot(role: Role): ErpSnapshot {
    return {
      generatedAt: new Date().toISOString(),
      currentRole: role,
      grantedPermissions: [...ROLE_PERMISSIONS[role]],
      rbac: {
        roles: (Object.keys(ROLE_PERMISSIONS) as Role[]).map((itemRole) => ({
          role: itemRole,
          label: ROLE_LABELS[itemRole],
          permissions: [...ROLE_PERMISSIONS[itemRole]],
        })),
      },
      dashboard: this.getDashboardMetrics(),
      masterData: {
        customers: [...this.data.customers],
        suppliers: [...this.data.suppliers],
        products: [...this.data.products],
        warehouses: [...this.data.warehouses],
        employees: [...this.data.employees],
      },
      operations: {
        boms: this.data.boms.map((bom) => ({
          id: bom.id,
          productId: bom.productId,
          productName: this.getProduct(bom.productId).name,
          revision: bom.revision,
          notes: bom.notes,
          lines: this.data.bomLines
            .filter((line) => line.bomId === bom.id)
            .map((line) => ({
              id: line.id,
              componentProductId: line.componentProductId,
              componentName: this.getProduct(line.componentProductId).name,
              quantity: line.quantity,
            })),
        })),
        workOrders: this.data.workOrders.map((workOrder) => ({
          ...workOrder,
          productName: this.getProduct(workOrder.productId).name,
        })),
        inventory: this.data.inventory.map((item) => {
          const product = this.getProduct(item.productId)
          return {
            ...item,
            sku: product.sku,
            itemName: product.name,
            availableStock: item.stockLevel - item.reservedStock,
            inventoryValue: roundMoney(item.stockLevel * product.unitCost),
            warehouseName: this.getWarehouse(item.warehouseId).name,
          }
        }),
        alerts: this.getInventoryAlerts(),
        purchaseOrders: this.data.purchaseOrders.map((purchaseOrder) => ({
          ...purchaseOrder,
          productName: this.getProduct(purchaseOrder.productId).name,
          supplierName: this.getSupplier(purchaseOrder.supplierId).name,
          totalCost: roundMoney(
            purchaseOrder.quantity * purchaseOrder.unitCost,
          ),
        })),
        qualityLogs: this.data.qualityLogs.map((qualityLog) => ({
          ...qualityLog,
          workOrderCode: this.getWorkOrder(qualityLog.workOrderId).code,
        })),
      },
      sales: {
        crmClients: [...this.data.crmClients],
        salesOrders: this.data.salesOrders.map((order) => ({
          ...order,
          clientName: this.getCrmClient(order.clientId).name,
          total: roundMoney(
            order.lineItems.reduce(
              (sum, line) => sum + getSalesOrderLineSubtotal(line),
              0,
            ),
          ),
        })),
        invoices: this.data.invoices.map((invoice) => {
          const salesOrder = this.getSalesOrder(invoice.salesOrderId)
          return {
            ...invoice,
            orderNumber: salesOrder.orderNumber,
            clientName: this.getCrmClient(salesOrder.clientId).name,
          }
        }),
      },
      finance: {
        accounts: [...this.data.accounts],
        journalEntries: this.data.journalEntries.map((entry) => ({
          ...entry,
          totalDebit: roundMoney(
            entry.lines.reduce((sum, line) => sum + line.debit, 0),
          ),
          totalCredit: roundMoney(
            entry.lines.reduce((sum, line) => sum + line.credit, 0),
          ),
        })),
        accountsPayable: this.data.purchaseOrders
          .filter((purchaseOrder) => purchaseOrder.status === 'confirmed')
          .map((purchaseOrder) => ({
            ...purchaseOrder,
            supplierName: this.getSupplier(purchaseOrder.supplierId).name,
            amount: roundMoney(
              purchaseOrder.quantity * purchaseOrder.unitCost,
            ),
          })),
        accountsReceivable: this.data.invoices.map((invoice) => {
          const salesOrder = this.getSalesOrder(invoice.salesOrderId)
          return {
            ...invoice,
            clientName: this.getCrmClient(salesOrder.clientId).name,
            outstandingAmount: roundMoney(invoice.total - invoice.amountPaid),
          }
        }),
        statements: this.getFinancialStatements(),
      },
    }
  }

  addBom(input: {
    productId: string
    revision: string
    notes: string
    lines: Array<{ componentProductId: string; quantity: number }>
  }) {
    const bom: Bom = {
      id: uniqueId('bom'),
      productId: input.productId,
      revision: input.revision,
      notes: input.notes,
    }
    this.data.boms.push(bom)
    input.lines.forEach((line) => {
      this.data.bomLines.push({
        id: uniqueId('bom-line'),
        bomId: bom.id,
        componentProductId: line.componentProductId,
        quantity: line.quantity,
      })
    })
    return bom
  }

  createWorkOrder(input: {
    productId: string
    quantity: number
    dueDate: string
    priority: 'low' | 'medium' | 'high'
    notes: string
  }) {
    const sequence = this.data.workOrders.length + 1001
    const workOrder: WorkOrder = {
      id: uniqueId('wo'),
      code: `WO-${sequence}`,
      productId: input.productId,
      quantity: input.quantity,
      stage: 'planned',
      dueDate: input.dueDate,
      priority: input.priority,
      notes: input.notes,
    }
    this.data.workOrders.unshift(workOrder)
    return workOrder
  }

  advanceWorkOrder(workOrderId: string) {
    const workOrder = this.getWorkOrder(workOrderId)
    const currentIndex = stageIndex(workOrder.stage)
    if (currentIndex === WORK_ORDER_FLOW.length - 1) {
      return workOrder
    }
    const nextStage = WORK_ORDER_FLOW[currentIndex + 1]
    workOrder.stage = nextStage

    if (nextStage === 'completed') {
      this.consumeBomInventory(workOrder)
    }

    return workOrder
  }

  createPurchaseOrderFromAlert(sku: string) {
    const alert = this.getInventoryAlerts().find((item) => item.sku === sku)
    if (!alert) {
      throw new Error(`No active alert for SKU ${sku}.`)
    }
    const existingDraft = this.data.purchaseOrders.find(
      (purchaseOrder) =>
        purchaseOrder.sourceAlertSku === sku && purchaseOrder.status === 'draft',
    )
    if (existingDraft) {
      return existingDraft
    }

    const product = this.getProductBySku(sku)
    const sequence = this.data.purchaseOrders.length + 901
    const purchaseOrder: PurchaseOrder = {
      id: uniqueId('po'),
      poNumber: `PO-${sequence}`,
      supplierId: this.data.suppliers[0].id,
      productId: product.id,
      quantity: alert.suggestedQuantity,
      unitCost: product.unitCost,
      status: 'draft',
      sourceAlertSku: sku,
      createdAt: new Date().toISOString(),
    }
    this.data.purchaseOrders.unshift(purchaseOrder)
    return purchaseOrder
  }

  confirmPurchaseOrder(purchaseOrderId: string) {
    const purchaseOrder = this.getPurchaseOrder(purchaseOrderId)
    if (purchaseOrder.status === 'confirmed') {
      return purchaseOrder
    }
    purchaseOrder.status = 'confirmed'
    const inventoryRecord = this.getInventoryRecord(purchaseOrder.productId)
    inventoryRecord.stockLevel += purchaseOrder.quantity

    const amount = roundMoney(purchaseOrder.quantity * purchaseOrder.unitCost)
    this.recordJournalEntry({
      memo: `Confirmed purchase order ${purchaseOrder.poNumber}`,
      sourceType: 'purchase_order',
      sourceId: purchaseOrder.id,
      lines: [
        { accountId: ACCOUNT_IDS.rawInventory, debit: amount, credit: 0 },
        { accountId: ACCOUNT_IDS.accountsPayable, debit: 0, credit: amount },
      ],
    })

    return purchaseOrder
  }

  logQualityCheck(input: {
    workOrderId: string
    batchCode: string
    passedUnits: number
    failedUnits: number
    notes: string
  }) {
    const qualityLog: QualityLog = {
      id: uniqueId('qc'),
      workOrderId: input.workOrderId,
      batchCode: input.batchCode,
      passedUnits: input.passedUnits,
      failedUnits: input.failedUnits,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    }
    this.data.qualityLogs.unshift(qualityLog)
    return qualityLog
  }

  createSalesOrder(input: {
    clientId: string
    shippingAddress: string
    lineItems: Array<{ productId: string; quantity: number }>
  }) {
    const sequence = this.data.salesOrders.length + 1001
    const salesOrder: SalesOrder = {
      id: uniqueId('so'),
      orderNumber: `SO-${sequence}`,
      clientId: input.clientId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      shippingAddress: input.shippingAddress,
      lineItems: input.lineItems.map((line) => ({
        id: uniqueId('sol'),
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: this.getProduct(line.productId).salePrice,
      })),
    }
    this.data.salesOrders.unshift(salesOrder)
    return salesOrder
  }

  confirmSalesOrder(salesOrderId: string) {
    const salesOrder = this.getSalesOrder(salesOrderId)
    if (salesOrder.status !== 'draft') {
      return salesOrder
    }

    salesOrder.lineItems.forEach((line) => {
      const inventoryRecord = this.getInventoryRecord(line.productId)
      const available = inventoryRecord.stockLevel - inventoryRecord.reservedStock
      if (available < line.quantity) {
        throw new Error(
          `Insufficient available stock for ${this.getProduct(line.productId).name}.`,
        )
      }
    })

    salesOrder.lineItems.forEach((line) => {
      const inventoryRecord = this.getInventoryRecord(line.productId)
      inventoryRecord.reservedStock += line.quantity
    })

    salesOrder.status = 'confirmed'
    return salesOrder
  }

  createInvoice(input: {
    salesOrderId: string
    taxRate: number
    discountRate: number
    shippingFee: number
  }) {
    const salesOrder = this.getSalesOrder(input.salesOrderId)
    const existingInvoice = this.data.invoices.find(
      (invoice) => invoice.salesOrderId === input.salesOrderId,
    )
    if (existingInvoice) {
      return existingInvoice
    }

    const subtotal = roundMoney(
      salesOrder.lineItems.reduce(
        (sum, line) => sum + getSalesOrderLineSubtotal(line),
        0,
      ),
    )
    const discountAmount = roundMoney(subtotal * input.discountRate)
    const taxAmount = roundMoney((subtotal - discountAmount) * input.taxRate)
    const total = roundMoney(
      subtotal - discountAmount + taxAmount + input.shippingFee,
    )

    const sequence = this.data.invoices.length + 5001
    const invoice: Invoice = {
      id: uniqueId('invoice'),
      invoiceNumber: `INV-${sequence}`,
      salesOrderId: input.salesOrderId,
      status: 'sent',
      createdAt: new Date().toISOString(),
      subtotal,
      discountRate: input.discountRate,
      discountAmount,
      taxRate: input.taxRate,
      taxAmount,
      shippingFee: input.shippingFee,
      total,
      amountPaid: 0,
    }

    this.data.invoices.unshift(invoice)
    if (salesOrder.status === 'confirmed') {
      salesOrder.status = 'invoiced'
    }

    const revenueAmount = roundMoney(
      subtotal - discountAmount + input.shippingFee,
    )
    this.recordJournalEntry({
      memo: `Invoice ${invoice.invoiceNumber} issued`,
      sourceType: 'invoice',
      sourceId: invoice.id,
      lines: [
        {
          accountId: ACCOUNT_IDS.accountsReceivable,
          debit: total,
          credit: 0,
        },
        { accountId: ACCOUNT_IDS.salesRevenue, debit: 0, credit: revenueAmount },
        { accountId: ACCOUNT_IDS.taxPayable, debit: 0, credit: taxAmount },
      ],
    })

    return invoice
  }

  recordPayment(input: { invoiceId: string; amount: number }) {
    const invoice = this.getInvoice(input.invoiceId)
    const remaining = roundMoney(invoice.total - invoice.amountPaid)
    if (input.amount <= 0 || input.amount > remaining) {
      throw new Error(`Payment amount must be between 0 and ${remaining}.`)
    }

    invoice.amountPaid = roundMoney(invoice.amountPaid + input.amount)
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = 'paid'
      const relatedOrder = this.getSalesOrder(invoice.salesOrderId)
      relatedOrder.status = 'paid'
    }

    const payment: Payment = {
      id: uniqueId('payment'),
      invoiceId: invoice.id,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    }
    this.data.payments.unshift(payment)

    this.recordJournalEntry({
      memo: `Payment received for ${invoice.invoiceNumber}`,
      sourceType: 'payment',
      sourceId: payment.id,
      lines: [
        { accountId: ACCOUNT_IDS.cash, debit: input.amount, credit: 0 },
        {
          accountId: ACCOUNT_IDS.accountsReceivable,
          debit: 0,
          credit: input.amount,
        },
      ],
    })

    return payment
  }

  private consumeBomInventory(workOrder: WorkOrder) {
    const bom = this.data.boms.find((item) => item.productId === workOrder.productId)
    if (!bom) {
      throw new Error('No BOM defined for the selected product.')
    }

    const bomLines = this.data.bomLines.filter((line) => line.bomId === bom.id)
    let totalCost = 0

    bomLines.forEach((line) => {
      const requiredQuantity = line.quantity * workOrder.quantity
      const inventoryRecord = this.getInventoryRecord(line.componentProductId)
      if (inventoryRecord.stockLevel < requiredQuantity) {
        throw new Error(
          `Not enough stock for ${this.getProduct(line.componentProductId).name}.`,
        )
      }
      inventoryRecord.stockLevel -= requiredQuantity
      totalCost += requiredQuantity * this.getProduct(line.componentProductId).unitCost
    })

    const finishedInventoryRecord = this.getInventoryRecord(workOrder.productId)
    finishedInventoryRecord.stockLevel += workOrder.quantity

    this.recordJournalEntry({
      memo: `Completed work order ${workOrder.code}`,
      sourceType: 'manufacturing',
      sourceId: workOrder.id,
      lines: [
        {
          accountId: ACCOUNT_IDS.finishedInventory,
          debit: roundMoney(totalCost),
          credit: 0,
        },
        {
          accountId: ACCOUNT_IDS.rawInventory,
          debit: 0,
          credit: roundMoney(totalCost),
        },
      ],
    })
  }

  private getDashboardMetrics(): DashboardMetrics {
    const totalRevenue = roundMoney(
      this.data.invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    )

    const pendingOrders =
      this.data.workOrders.filter((workOrder) => workOrder.stage !== 'completed')
        .length +
      this.data.salesOrders.filter((salesOrder) => salesOrder.status !== 'paid')
        .length

    const inventoryValue = roundMoney(
      this.data.inventory.reduce((sum, item) => {
        const product = this.getProduct(item.productId)
        return sum + item.stockLevel * product.unitCost
      }, 0),
    )

    const currentMonth = monthKey(new Date().toISOString())
    const monthlyExpenses = roundMoney(
      this.data.journalEntries.reduce((sum, entry) => {
        if (monthKey(entry.createdAt) !== currentMonth) {
          return sum
        }
        return (
          sum +
          entry.lines.reduce((lineSum, line) => {
            const account = this.getAccount(line.accountId)
            if (account.category !== 'expense') {
              return lineSum
            }
            return lineSum + line.debit - line.credit
          }, 0)
        )
      }, 0),
    )

    return {
      totalRevenue,
      pendingOrders,
      inventoryValue,
      monthlyExpenses,
    }
  }

  private getInventoryAlerts(): InventoryAlert[] {
    return this.data.inventory
      .map((item) => {
        const product = this.getProduct(item.productId)
        const availableStock = item.stockLevel - item.reservedStock
        return {
          sku: product.sku,
          itemName: product.name,
          availableStock,
          reorderPoint: item.reorderPoint,
          suggestedQuantity: Math.max(
            item.reorderPoint * 2 - availableStock,
            item.reorderPoint,
          ),
          location: item.location,
        }
      })
      .filter((alert) => alert.availableStock < alert.reorderPoint)
  }

  private getFinancialStatements(): FinancialStatements {
    const balances = new Map<string, number>()
    this.data.accounts.forEach((account) => balances.set(account.id, 0))

    this.data.journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const account = this.getAccount(line.accountId)
        const existingBalance = balances.get(account.id) ?? 0
        const delta =
          account.category === 'asset' || account.category === 'expense'
            ? line.debit - line.credit
            : line.credit - line.debit
        balances.set(account.id, roundMoney(existingBalance + delta))
      })
    })

    const incomeStatement = this.data.accounts.reduce(
      (summary, account) => {
        const balance = balances.get(account.id) ?? 0
        if (account.category === 'revenue') {
          summary.revenue += balance
        }
        if (account.category === 'expense') {
          summary.expenses += balance
        }
        summary.netIncome = roundMoney(summary.revenue - summary.expenses)
        return summary
      },
      { revenue: 0, expenses: 0, netIncome: 0 },
    )

    const balanceSheet = this.data.accounts.reduce(
      (summary, account) => {
        const balance = balances.get(account.id) ?? 0
        if (account.category === 'asset') {
          summary.assets += balance
        }
        if (account.category === 'liability') {
          summary.liabilities += balance
        }
        if (account.category === 'equity') {
          summary.equity += balance
        }
        return summary
      },
      { assets: 0, liabilities: 0, equity: 0 },
    )

    balanceSheet.equity = roundMoney(
      balanceSheet.equity + incomeStatement.netIncome,
    )

    const operatingCashFlow = roundMoney(
      this.data.journalEntries
        .filter((entry) =>
          ['expense', 'invoice', 'payment', 'purchase_order'].includes(
            entry.sourceType,
          ),
        )
        .reduce((sum, entry) => {
          const cashLine = entry.lines.find(
            (line) => line.accountId === ACCOUNT_IDS.cash,
          )
          if (!cashLine) {
            return sum
          }
          return sum + cashLine.debit - cashLine.credit
        }, 0),
    )

    const cashFlow = {
      operatingCashFlow,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: operatingCashFlow,
    }

    return {
      incomeStatement: {
        revenue: roundMoney(incomeStatement.revenue),
        expenses: roundMoney(incomeStatement.expenses),
        netIncome: roundMoney(incomeStatement.netIncome),
      },
      balanceSheet: {
        assets: roundMoney(balanceSheet.assets),
        liabilities: roundMoney(balanceSheet.liabilities),
        equity: roundMoney(balanceSheet.equity),
      },
      cashFlow,
    }
  }

  private recordJournalEntry(input: {
    memo: string
    sourceType: JournalEntry['sourceType']
    sourceId: string
    lines: JournalEntryLine[]
  }) {
    const entry: JournalEntry = {
      id: uniqueId('je'),
      memo: input.memo,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      createdAt: new Date().toISOString(),
      lines: input.lines.map((line) => ({
        ...line,
        debit: roundMoney(line.debit),
        credit: roundMoney(line.credit),
      })),
    }
    this.data.journalEntries.unshift(entry)
    return entry
  }

  private getProduct(productId: string) {
    const product = this.data.products.find((item) => item.id === productId)
    if (!product) {
      throw new Error(`Product ${productId} was not found.`)
    }
    return product
  }

  private getProductBySku(sku: string) {
    const product = this.data.products.find((item) => item.sku === sku)
    if (!product) {
      throw new Error(`Product with SKU ${sku} was not found.`)
    }
    return product
  }

  private getWarehouse(warehouseId: string) {
    const warehouse = this.data.warehouses.find((item) => item.id === warehouseId)
    if (!warehouse) {
      throw new Error(`Warehouse ${warehouseId} was not found.`)
    }
    return warehouse
  }

  private getSupplier(supplierId: string) {
    const supplier = this.data.suppliers.find((item) => item.id === supplierId)
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} was not found.`)
    }
    return supplier
  }

  private getWorkOrder(workOrderId: string) {
    const workOrder = this.data.workOrders.find((item) => item.id === workOrderId)
    if (!workOrder) {
      throw new Error(`Work order ${workOrderId} was not found.`)
    }
    return workOrder
  }

  private getPurchaseOrder(purchaseOrderId: string) {
    const purchaseOrder = this.data.purchaseOrders.find(
      (item) => item.id === purchaseOrderId,
    )
    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} was not found.`)
    }
    return purchaseOrder
  }

  private getSalesOrder(salesOrderId: string) {
    const salesOrder = this.data.salesOrders.find((item) => item.id === salesOrderId)
    if (!salesOrder) {
      throw new Error(`Sales order ${salesOrderId} was not found.`)
    }
    return salesOrder
  }

  private getCrmClient(clientId: string) {
    const client = this.data.crmClients.find((item) => item.id === clientId)
    if (!client) {
      throw new Error(`CRM client ${clientId} was not found.`)
    }
    return client
  }

  private getInventoryRecord(productId: string) {
    const inventoryRecord = this.data.inventory.find(
      (item) => item.productId === productId,
    )
    if (!inventoryRecord) {
      throw new Error(`Inventory record for product ${productId} was not found.`)
    }
    return inventoryRecord
  }

  private getInvoice(invoiceId: string) {
    const invoice = this.data.invoices.find((item) => item.id === invoiceId)
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} was not found.`)
    }
    return invoice
  }

  private getAccount(accountId: string) {
    const account = this.data.accounts.find((item) => item.id === accountId)
    if (!account) {
      throw new Error(`Account ${accountId} was not found.`)
    }
    return account
  }
}
