import { useEffect, useMemo, useState } from 'react'

import {
  advanceWorkOrder,
  confirmPurchaseOrder,
  confirmSalesOrder,
  createBom,
  createInvoice,
  createPurchaseOrderDraft,
  createQualityLog,
  createSalesOrder,
  createWorkOrder,
  invoicePdfUrl,
  loadSnapshot,
  recordPayment,
} from './api'
import type { Permission, Role, Snapshot, WorkOrderStage } from './types'

type View = 'admin' | 'operations' | 'sales' | 'finance'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const stageLabels: Record<WorkOrderStage, string> = {
  planned: 'Planned',
  in_production: 'In-Production',
  quality_check: 'Quality Check',
  completed: 'Completed',
}

const stageSequence: WorkOrderStage[] = [
  'planned',
  'in_production',
  'quality_check',
  'completed',
]

const viewLabels: Record<View, string> = {
  admin: 'Admin Dashboard',
  operations: 'Operations & Inventory',
  sales: 'Sales',
  finance: 'Finance',
}

function App() {
  const [role, setRole] = useState<Role>('admin')
  const [view, setView] = useState<View>('admin')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('Loading ERP workspace...')

  const [bomForm, setBomForm] = useState({
    productId: '',
    revision: 'R1',
    notes: '',
    lines: [{ componentProductId: '', quantity: 1 }],
  })

  const [workOrderForm, setWorkOrderForm] = useState({
    productId: '',
    quantity: 1,
    dueDate: new Date().toISOString().slice(0, 10),
    priority: 'medium' as const,
    notes: '',
  })

  const [qcForm, setQcForm] = useState({
    workOrderId: '',
    batchCode: '',
    passedUnits: 0,
    failedUnits: 0,
    notes: '',
  })

  const [salesOrderForm, setSalesOrderForm] = useState({
    clientId: '',
    shippingAddress: '',
    lineItems: [{ productId: '', quantity: 1 }],
  })

  const [invoiceForm, setInvoiceForm] = useState({
    salesOrderId: '',
    taxRate: 0.08,
    discountRate: 0.03,
    shippingFee: 65,
  })

  const can = (permission: Permission) =>
    snapshot?.grantedPermissions.includes(permission) ?? false

  const refreshSnapshot = async (selectedRole: Role) => {
    setLoading(true)
    setError(null)
    try {
      const nextSnapshot = await loadSnapshot(selectedRole)
      setSnapshot(nextSnapshot)
      setNotice(`Live sync at ${new Date(nextSnapshot.generatedAt).toLocaleTimeString()}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load ERP data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextSnapshot = await loadSnapshot(role)
        setSnapshot(nextSnapshot)
        setNotice(
          `Live sync at ${new Date(nextSnapshot.generatedAt).toLocaleTimeString()}`,
        )
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load ERP data.',
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
    const interval = window.setInterval(() => {
      void load()
    }, 10000)
    return () => window.clearInterval(interval)
  }, [role])

  const runMutation = async (
    action: () => Promise<{ snapshot: Snapshot }>,
    successMessage: string,
  ) => {
    setBusy(true)
    setError(null)
    try {
      const response = await action()
      setSnapshot(response.snapshot)
      setNotice(successMessage)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Mutation failed.')
    } finally {
      setBusy(false)
    }
  }

  const groupedWorkOrders = useMemo(() => {
    const groups: Record<WorkOrderStage, Snapshot['operations']['workOrders']> = {
      planned: [],
      in_production: [],
      quality_check: [],
      completed: [],
    }
    snapshot?.operations.workOrders.forEach((workOrder) => {
      groups[workOrder.stage].push(workOrder)
    })
    return groups
  }, [snapshot])

  const finishedProducts =
    snapshot?.masterData.products.filter((product) => product.kind === 'finished_good') ?? []
  const componentProducts =
    snapshot?.masterData.products.filter((product) => product.kind !== 'finished_good') ?? []
  const completedWorkOrders =
    snapshot?.operations.workOrders.filter((workOrder) => workOrder.stage === 'completed') ?? []
  const invoiceReadyOrders =
    snapshot?.sales.salesOrders.filter((salesOrder) => salesOrder.status === 'confirmed') ?? []
  const selectedBomProductId = bomForm.productId || finishedProducts[0]?.id || ''
  const selectedWorkOrderProductId = workOrderForm.productId || finishedProducts[0]?.id || ''
  const selectedQcWorkOrderId = qcForm.workOrderId || completedWorkOrders[0]?.id || ''
  const selectedSalesClientId =
    salesOrderForm.clientId || snapshot?.sales.crmClients[0]?.id || ''
  const selectedInvoiceSalesOrderId =
    invoiceForm.salesOrderId || invoiceReadyOrders[0]?.id || ''

  if (loading && !snapshot) {
    return <div className="page-shell loading-shell">Loading ERP workspace...</div>
  }

  if (!snapshot) {
    return (
      <div className="page-shell loading-shell">
        <div className="panel">
          <h1>Unable to load ERP workspace</h1>
          <p>{error ?? 'Unknown error'}</p>
          <button type="button" onClick={() => void refreshSnapshot(role)}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="hero-header">
        <div>
          <span className="eyebrow">Manufacturing ERP</span>
          <h1>Full-stack manufacturing control center</h1>
          <p className="hero-copy">
            React admin workspace backed by a Node API and Supabase-ready schema for
            inventory, production, sales, and finance.
          </p>
        </div>

        <div className="hero-actions">
          <label className="field">
            <span>Demo role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
              <option value="operations">Operations</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="accountant">Accountant</option>
            </select>
          </label>
          <div className="status-stack">
            <span className="status-pill">{snapshot.rbac.roles.find((item) => item.role === role)?.label}</span>
            <span className="status-pill subtle">{notice}</span>
            {busy && <span className="status-pill warning">Saving changes...</span>}
            {error && <span className="status-pill danger">{error}</span>}
          </div>
        </div>
      </header>

      <nav className="tab-row" aria-label="ERP navigation">
        {(Object.keys(viewLabels) as View[]).map((itemView) => (
          <button
            key={itemView}
            type="button"
            className={view === itemView ? 'tab active' : 'tab'}
            onClick={() => setView(itemView)}
          >
            {viewLabels[itemView]}
          </button>
        ))}
      </nav>

      <main className="content-stack">
        {(view === 'admin' || view === 'operations' || view === 'sales' || view === 'finance') && (
          <section className="kpi-grid">
            <article className="kpi-card">
              <span>Total Revenue</span>
              <strong>{formatCompactCurrency(snapshot.dashboard.totalRevenue)}</strong>
              <small>Invoiced revenue across all sales orders.</small>
            </article>
            <article className="kpi-card">
              <span>Pending Orders</span>
              <strong>{snapshot.dashboard.pendingOrders}</strong>
              <small>Open work orders plus unpaid sales flow.</small>
            </article>
            <article className="kpi-card">
              <span>Inventory Value</span>
              <strong>{formatCompactCurrency(snapshot.dashboard.inventoryValue)}</strong>
              <small>Live warehouse valuation from on-hand stock.</small>
            </article>
            <article className="kpi-card">
              <span>Monthly Expenses</span>
              <strong>{formatCompactCurrency(snapshot.dashboard.monthlyExpenses)}</strong>
              <small>Expense-ledger total for the current month.</small>
            </article>
          </section>
        )}

        {view === 'admin' && (
          <>
            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Real-time executive overview</h2>
                    <p>Critical operating pressure points updated from live module state.</p>
                  </div>
                </div>
                <div className="overview-grid">
                  <div className="metric-tile">
                    <span>Open low-stock alerts</span>
                    <strong>{snapshot.operations.alerts.length}</strong>
                  </div>
                  <div className="metric-tile">
                    <span>Active work orders</span>
                    <strong>
                      {snapshot.operations.workOrders.filter((item) => item.stage !== 'completed').length}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>Open receivables</span>
                    <strong>
                      {formatCompactCurrency(
                        snapshot.finance.accountsReceivable.reduce(
                          (sum, item) => sum + item.outstandingAmount,
                          0,
                        ),
                      )}
                    </strong>
                  </div>
                  <div className="metric-tile">
                    <span>Confirmed payables</span>
                    <strong>
                      {formatCompactCurrency(
                        snapshot.finance.accountsPayable.reduce(
                          (sum, item) => sum + item.amount,
                          0,
                        ),
                      )}
                    </strong>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>RBAC matrix</h2>
                    <p>Supabase-ready role grants across Admin, Sales, Operations, Warehouse, and Finance.</p>
                  </div>
                </div>
                <div className="rbac-list">
                  {snapshot.rbac.roles.map((item) => (
                    <div key={item.role} className="rbac-card">
                      <h3>{item.label}</h3>
                      <ul className="pill-list">
                        {item.permissions.map((permission) => (
                          <li key={permission}>{permission}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Inventory risk radar</h2>
                    <p>Auto-suggested purchase order drafts whenever availability falls below reorder point.</p>
                  </div>
                </div>
                <div className="list-stack">
                  {snapshot.operations.alerts.map((alert) => (
                    <div key={alert.sku} className="list-row">
                      <div>
                        <strong>{alert.itemName}</strong>
                        <p>
                          {alert.sku} · available {alert.availableStock} / reorder {alert.reorderPoint}
                        </p>
                      </div>
                      <div className="row-actions">
                        <span className="badge danger">Suggest PO {alert.suggestedQuantity}</span>
                        {can('purchase_orders.manage') && (
                          <button
                            type="button"
                            onClick={() =>
                              void runMutation(
                                () => createPurchaseOrderDraft(role, alert.sku),
                                `Purchase order draft prepared for ${alert.itemName}.`,
                              )
                            }
                          >
                            Draft PO
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Cross-module pulse</h2>
                    <p>Customers, suppliers, employees, and CRM pipeline at a glance.</p>
                  </div>
                </div>
                <div className="overview-grid">
                  <div className="metric-tile">
                    <span>Customers</span>
                    <strong>{snapshot.masterData.customers.length}</strong>
                  </div>
                  <div className="metric-tile">
                    <span>Suppliers</span>
                    <strong>{snapshot.masterData.suppliers.length}</strong>
                  </div>
                  <div className="metric-tile">
                    <span>Employees</span>
                    <strong>{snapshot.masterData.employees.length}</strong>
                  </div>
                  <div className="metric-tile">
                    <span>CRM pipeline</span>
                    <strong>{snapshot.sales.crmClients.length} deals</strong>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}

        {view === 'operations' && (
          <>
            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Bill of materials</h2>
                    <p>Define finished products, sub-assemblies, raw materials, and required quantities.</p>
                  </div>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void runMutation(
                      () =>
                        createBom(role, {
                          productId: selectedBomProductId,
                          revision: bomForm.revision,
                          notes: bomForm.notes,
                          lines: bomForm.lines.filter((line) => line.componentProductId),
                        }),
                      'BOM saved successfully.',
                    )
                  }}
                >
                  <label className="field">
                    <span>Finished product</span>
                    <select
                      value={selectedBomProductId}
                      onChange={(event) =>
                        setBomForm((current) => ({ ...current, productId: event.target.value }))
                      }
                    >
                      {finishedProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Revision</span>
                    <input
                      value={bomForm.revision}
                      onChange={(event) =>
                        setBomForm((current) => ({ ...current, revision: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field full-width">
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={bomForm.notes}
                      onChange={(event) =>
                        setBomForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>

                  <div className="full-width">
                    <div className="section-subtitle">Components</div>
                    <div className="list-stack">
                      {bomForm.lines.map((line, index) => (
                        <div key={`${index}-${line.componentProductId}`} className="inline-grid">
                          <label className="field">
                            <span>Component</span>
                            <select
                              value={line.componentProductId}
                              onChange={(event) =>
                                setBomForm((current) => ({
                                  ...current,
                                  lines: current.lines.map((currentLine, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...currentLine,
                                          componentProductId: event.target.value,
                                        }
                                      : currentLine,
                                  ),
                                }))
                              }
                            >
                              <option value="">Select component</option>
                              {componentProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Quantity</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={line.quantity}
                              onChange={(event) =>
                                setBomForm((current) => ({
                                  ...current,
                                  lines: current.lines.map((currentLine, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...currentLine,
                                          quantity: Number(event.target.value),
                                        }
                                      : currentLine,
                                  ),
                                }))
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setBomForm((current) => ({
                          ...current,
                          lines: [...current.lines, { componentProductId: '', quantity: 1 }],
                        }))
                      }
                    >
                      Add component
                    </button>
                  </div>

                  <button type="submit" disabled={!can('bom.manage')}>
                    Save BOM
                  </button>
                </form>

                <div className="list-stack">
                  {snapshot.operations.boms.map((bom) => (
                    <div key={bom.id} className="list-row">
                      <div>
                        <strong>
                          {bom.productName} · {bom.revision}
                        </strong>
                        <p>{bom.lines.map((line) => `${line.componentName} x ${line.quantity}`).join(' · ')}</p>
                      </div>
                      <span className="badge">{bom.notes}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Quality control</h2>
                    <p>Log pass/fail metrics for completed batches and retain the batch trail.</p>
                  </div>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void runMutation(
                      () =>
                        createQualityLog(role, {
                          ...qcForm,
                          workOrderId: selectedQcWorkOrderId,
                        }),
                      'Quality control results logged.',
                    )
                  }}
                >
                  <label className="field">
                    <span>Completed work order</span>
                    <select
                      value={selectedQcWorkOrderId}
                      onChange={(event) =>
                        setQcForm((current) => ({ ...current, workOrderId: event.target.value }))
                      }
                    >
                      {completedWorkOrders.map((workOrder) => (
                        <option key={workOrder.id} value={workOrder.id}>
                          {workOrder.code} · {workOrder.productName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Batch code</span>
                    <input
                      value={qcForm.batchCode}
                      onChange={(event) =>
                        setQcForm((current) => ({ ...current, batchCode: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Passed units</span>
                    <input
                      type="number"
                      min="0"
                      value={qcForm.passedUnits}
                      onChange={(event) =>
                        setQcForm((current) => ({
                          ...current,
                          passedUnits: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Failed units</span>
                    <input
                      type="number"
                      min="0"
                      value={qcForm.failedUnits}
                      onChange={(event) =>
                        setQcForm((current) => ({
                          ...current,
                          failedUnits: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field full-width">
                    <span>Notes</span>
                    <textarea
                      rows={3}
                      value={qcForm.notes}
                      onChange={(event) =>
                        setQcForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" disabled={!can('quality_control.log')}>
                    Log QC result
                  </button>
                </form>

                <div className="list-stack">
                  {snapshot.operations.qualityLogs.map((qualityLog) => (
                    <div key={qualityLog.id} className="list-row">
                      <div>
                        <strong>
                          {qualityLog.workOrderCode} · {qualityLog.batchCode}
                        </strong>
                        <p>
                          Passed {qualityLog.passedUnits} · Failed {qualityLog.failedUnits}
                        </p>
                      </div>
                      <span className="badge">{formatDate(qualityLog.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Work orders</h2>
                  <p>Kanban board with stage-driven production tracking and automatic material consumption at completion.</p>
                </div>
              </div>

              <form
                className="form-grid compact-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void runMutation(
                    () =>
                      createWorkOrder(role, {
                        ...workOrderForm,
                        productId: selectedWorkOrderProductId,
                      }),
                    'Work order added to the production queue.',
                  )
                }}
              >
                <label className="field">
                  <span>Finished product</span>
                  <select
                    value={selectedWorkOrderProductId}
                    onChange={(event) =>
                      setWorkOrderForm((current) => ({ ...current, productId: event.target.value }))
                    }
                  >
                    {finishedProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={workOrderForm.quantity}
                    onChange={(event) =>
                      setWorkOrderForm((current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input
                    type="date"
                    value={workOrderForm.dueDate}
                    onChange={(event) =>
                      setWorkOrderForm((current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select
                    value={workOrderForm.priority}
                    onChange={(event) =>
                      setWorkOrderForm((current) => ({
                        ...current,
                        priority: event.target.value as 'low' | 'medium' | 'high',
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="field full-width">
                  <span>Notes</span>
                  <input
                    value={workOrderForm.notes}
                    onChange={(event) =>
                      setWorkOrderForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </label>
                <button type="submit" disabled={!can('work_orders.manage')}>
                  Add work order
                </button>
              </form>

              <div className="kanban-grid">
                {stageSequence.map((stage) => (
                  <div key={stage} className="kanban-column">
                    <div className="kanban-header">
                      <h3>{stageLabels[stage]}</h3>
                      <span className="badge">{groupedWorkOrders[stage].length}</span>
                    </div>
                    {groupedWorkOrders[stage].map((workOrder) => {
                      const nextStage = stageSequence[stageSequence.indexOf(workOrder.stage) + 1]
                      return (
                        <div key={workOrder.id} className="kanban-card">
                          <strong>{workOrder.code}</strong>
                          <p>{workOrder.productName}</p>
                          <small>
                            Qty {workOrder.quantity} · Due {formatDate(workOrder.dueDate)}
                          </small>
                          <span className={`badge priority-${workOrder.priority}`}>{workOrder.priority}</span>
                          {nextStage && (
                            <button
                              type="button"
                              disabled={!can('work_orders.manage')}
                              onClick={() =>
                                void runMutation(
                                  () => advanceWorkOrder(role, workOrder.id),
                                  nextStage === 'completed'
                                    ? `${workOrder.code} completed and inventory updated.`
                                    : `${workOrder.code} moved to ${stageLabels[nextStage]}.`,
                                )
                              }
                            >
                              Move to {stageLabels[nextStage]}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Inventory management</h2>
                  <p>Real-time stock tracker with reorder signals, suggested PO drafts, and storage locations.</p>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Item</th>
                      <th>Stock</th>
                      <th>Reserved</th>
                      <th>Available</th>
                      <th>Reorder Point</th>
                      <th>Location</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.operations.inventory.map((item) => {
                      const isLow = item.availableStock < item.reorderPoint
                      return (
                        <tr key={item.id}>
                          <td>{item.sku}</td>
                          <td>
                            <div className="table-title">
                              <strong>{item.itemName}</strong>
                              {isLow && <span className="badge danger">Low stock</span>}
                            </div>
                          </td>
                          <td>{item.stockLevel}</td>
                          <td>{item.reservedStock}</td>
                          <td>{item.availableStock}</td>
                          <td>{item.reorderPoint}</td>
                          <td>{item.location}</td>
                          <td>{formatCurrency(item.inventoryValue)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="list-stack top-gap">
                {snapshot.operations.purchaseOrders.map((purchaseOrder) => (
                  <div key={purchaseOrder.id} className="list-row">
                    <div>
                      <strong>
                        {purchaseOrder.poNumber} · {purchaseOrder.productName}
                      </strong>
                      <p>
                        {purchaseOrder.supplierName} · Qty {purchaseOrder.quantity} · {formatCurrency(purchaseOrder.totalCost)}
                      </p>
                    </div>
                    <div className="row-actions">
                      <span className={`badge ${purchaseOrder.status === 'confirmed' ? 'success' : ''}`}>
                        {purchaseOrder.status}
                      </span>
                      {purchaseOrder.status === 'draft' && (
                        <button
                          type="button"
                          disabled={!can('purchase_orders.manage')}
                          onClick={() =>
                            void runMutation(
                              () => confirmPurchaseOrder(role, purchaseOrder.id),
                              `${purchaseOrder.poNumber} confirmed and AP logged.`,
                            )
                          }
                        >
                          Confirm PO
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'sales' && (
          <>
            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>CRM pipeline</h2>
                    <p>Clients tracked from lead to won with estimated deal value.</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Contact</th>
                        <th>Stage</th>
                        <th>Estimated Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.sales.crmClients.map((client) => (
                        <tr key={client.id}>
                          <td>{client.name}</td>
                          <td>
                            {client.contactName}
                            <div className="table-subtext">{client.email}</div>
                          </td>
                          <td>
                            <span className={`badge stage-${client.stage}`}>{client.stage}</span>
                          </td>
                          <td>{formatCurrency(client.estimatedValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Create sales order</h2>
                    <p>Generate sales orders that reserve inventory once confirmed.</p>
                  </div>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void runMutation(
                      () =>
                        createSalesOrder(role, {
                          clientId: selectedSalesClientId,
                          shippingAddress: salesOrderForm.shippingAddress,
                          lineItems: salesOrderForm.lineItems.filter((item) => item.productId),
                        }),
                      'Sales order created.',
                    )
                  }}
                >
                  <label className="field">
                    <span>Client</span>
                    <select
                      value={selectedSalesClientId}
                      onChange={(event) =>
                        setSalesOrderForm((current) => ({ ...current, clientId: event.target.value }))
                      }
                    >
                      {snapshot.sales.crmClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field full-width">
                    <span>Shipping address</span>
                    <input
                      value={salesOrderForm.shippingAddress}
                      onChange={(event) =>
                        setSalesOrderForm((current) => ({
                          ...current,
                          shippingAddress: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="full-width">
                    <div className="section-subtitle">Line items</div>
                    <div className="list-stack">
                      {salesOrderForm.lineItems.map((line, index) => (
                        <div key={`${index}-${line.productId}`} className="inline-grid">
                          <label className="field">
                            <span>Product</span>
                            <select
                              value={line.productId}
                              onChange={(event) =>
                                setSalesOrderForm((current) => ({
                                  ...current,
                                  lineItems: current.lineItems.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, productId: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              <option value="">Select product</option>
                              {finishedProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Quantity</span>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(event) =>
                                setSalesOrderForm((current) => ({
                                  ...current,
                                  lineItems: current.lineItems.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, quantity: Number(event.target.value) }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setSalesOrderForm((current) => ({
                          ...current,
                          lineItems: [...current.lineItems, { productId: '', quantity: 1 }],
                        }))
                      }
                    >
                      Add line item
                    </button>
                  </div>
                  <button type="submit" disabled={!can('sales_orders.manage')}>
                    Generate SO
                  </button>
                </form>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Sales order flow</h2>
                  <p>Draft orders can be confirmed to reserve stock, then invoiced into finance.</p>
                </div>
              </div>
              <div className="list-stack">
                {snapshot.sales.salesOrders.map((salesOrder) => (
                  <div key={salesOrder.id} className="list-row">
                    <div>
                      <strong>
                        {salesOrder.orderNumber} · {salesOrder.clientName}
                      </strong>
                      <p>
                        {salesOrder.lineItems
                          .map((item) => {
                            const product = snapshot.masterData.products.find(
                              (productItem) => productItem.id === item.productId,
                            )
                            return `${product?.name ?? item.productId} x ${item.quantity}`
                          })
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="row-actions">
                      <span className="badge">{salesOrder.status}</span>
                      <span className="badge subtle">{formatCurrency(salesOrder.total)}</span>
                      {salesOrder.status === 'draft' && (
                        <button
                          type="button"
                          disabled={!can('sales_orders.manage')}
                          onClick={() =>
                            void runMutation(
                              () => confirmSalesOrder(role, salesOrder.id),
                              `${salesOrder.orderNumber} confirmed and inventory reserved.`,
                            )
                          }
                        >
                          Confirm order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Invoice generator</h2>
                    <p>Calculate taxes, discounts, shipping, and post the invoice into finance.</p>
                  </div>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void runMutation(
                      () =>
                        createInvoice(role, {
                          ...invoiceForm,
                          salesOrderId: selectedInvoiceSalesOrderId,
                        }),
                      'Invoice generated.',
                    )
                  }}
                >
                  <label className="field">
                    <span>Confirmed sales order</span>
                    <select
                      value={selectedInvoiceSalesOrderId}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({
                          ...current,
                          salesOrderId: event.target.value,
                        }))
                      }
                    >
                      {invoiceReadyOrders.map((salesOrder) => (
                        <option key={salesOrder.id} value={salesOrder.id}>
                          {salesOrder.orderNumber} · {salesOrder.clientName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Tax rate</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={invoiceForm.taxRate}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({
                          ...current,
                          taxRate: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Discount rate</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={invoiceForm.discountRate}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({
                          ...current,
                          discountRate: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Shipping fee</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={invoiceForm.shippingFee}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({
                          ...current,
                          shippingFee: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <button type="submit" disabled={!can('invoices.manage')}>
                    Generate invoice
                  </button>
                </form>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Invoices</h2>
                    <p>Downloadable PDFs and outstanding balances synced to the finance module.</p>
                  </div>
                </div>
                <div className="list-stack">
                  {snapshot.sales.invoices.map((invoice) => (
                    <div key={invoice.id} className="list-row">
                      <div>
                        <strong>
                          {invoice.invoiceNumber} · {invoice.clientName}
                        </strong>
                        <p>
                          {invoice.orderNumber} · Total {formatCurrency(invoice.total)} · Paid{' '}
                          {formatCurrency(invoice.amountPaid)}
                        </p>
                      </div>
                      <div className="row-actions">
                        <span className={`badge ${invoice.status === 'paid' ? 'success' : ''}`}>
                          {invoice.status}
                        </span>
                        <a className="button-link" href={invoicePdfUrl(invoice.id, role)} target="_blank" rel="noreferrer">
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {view === 'finance' && (
          <>
            <section className="grid-three">
              <article className="panel statement-panel">
                <h2>Income Statement</h2>
                <div className="statement-line">
                  <span>Revenue</span>
                  <strong>{formatCurrency(snapshot.finance.statements.incomeStatement.revenue)}</strong>
                </div>
                <div className="statement-line">
                  <span>Expenses</span>
                  <strong>{formatCurrency(snapshot.finance.statements.incomeStatement.expenses)}</strong>
                </div>
                <div className="statement-line total">
                  <span>Net income</span>
                  <strong>{formatCurrency(snapshot.finance.statements.incomeStatement.netIncome)}</strong>
                </div>
              </article>

              <article className="panel statement-panel">
                <h2>Balance Sheet</h2>
                <div className="statement-line">
                  <span>Assets</span>
                  <strong>{formatCurrency(snapshot.finance.statements.balanceSheet.assets)}</strong>
                </div>
                <div className="statement-line">
                  <span>Liabilities</span>
                  <strong>{formatCurrency(snapshot.finance.statements.balanceSheet.liabilities)}</strong>
                </div>
                <div className="statement-line total">
                  <span>Equity</span>
                  <strong>{formatCurrency(snapshot.finance.statements.balanceSheet.equity)}</strong>
                </div>
              </article>

              <article className="panel statement-panel">
                <h2>Cash Flow</h2>
                <div className="statement-line">
                  <span>Operating</span>
                  <strong>{formatCurrency(snapshot.finance.statements.cashFlow.operatingCashFlow)}</strong>
                </div>
                <div className="statement-line">
                  <span>Investing</span>
                  <strong>{formatCurrency(snapshot.finance.statements.cashFlow.investingCashFlow)}</strong>
                </div>
                <div className="statement-line total">
                  <span>Net cash flow</span>
                  <strong>{formatCurrency(snapshot.finance.statements.cashFlow.netCashFlow)}</strong>
                </div>
              </article>
            </section>

            <section className="grid-two">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Accounts payable</h2>
                    <p>Confirmed purchase orders flow directly into AP.</p>
                  </div>
                </div>
                <div className="list-stack">
                  {snapshot.finance.accountsPayable.map((entry) => (
                    <div key={entry.id} className="list-row">
                      <div>
                        <strong>{entry.poNumber}</strong>
                        <p>
                          {entry.supplierName} · {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <div className="row-actions">
                        <span className="badge success">{entry.status}</span>
                        <span className="badge subtle">{formatCurrency(entry.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Accounts receivable</h2>
                    <p>Record incoming payments against confirmed invoices.</p>
                  </div>
                </div>
                <div className="list-stack">
                  {snapshot.finance.accountsReceivable.map((entry) => (
                    <div key={entry.id} className="list-row">
                      <div>
                        <strong>
                          {entry.invoiceNumber} · {entry.clientName}
                        </strong>
                        <p>
                          Outstanding {formatCurrency(entry.outstandingAmount)} of {formatCurrency(entry.total)}
                        </p>
                      </div>
                      <div className="row-actions">
                        <span className={`badge ${entry.status === 'paid' ? 'success' : ''}`}>
                          {entry.status}
                        </span>
                        {entry.outstandingAmount > 0 && (
                          <button
                            type="button"
                            disabled={!can('payments.record')}
                            onClick={() =>
                              void runMutation(
                                () => recordPayment(role, entry.id, entry.outstandingAmount),
                                `${entry.invoiceNumber} payment posted to AR.`,
                              )
                            }
                          >
                            Record payment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>General ledger</h2>
                  <p>Double-entry journal with debits, credits, and categorized accounts.</p>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Memo</th>
                      <th>Source</th>
                      <th>Total Debits</th>
                      <th>Total Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.finance.journalEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.createdAt)}</td>
                        <td>{entry.memo}</td>
                        <td>{entry.sourceType}</td>
                        <td>{formatCurrency(entry.totalDebit)}</td>
                        <td>{formatCurrency(entry.totalCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer-note">
        Live role permissions are enforced on API mutations. Switch roles to inspect the RBAC envelope.
      </footer>
    </div>
  )
}

export default App
