import type { Role, Snapshot } from './types'

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(errorPayload?.message ?? 'Request failed.')
  }
  return (await response.json()) as T
}

const headersFor = (role: Role) => ({
  'Content-Type': 'application/json',
  'x-demo-role': role,
})

export const loadSnapshot = async (role: Role): Promise<Snapshot> =>
  parseResponse<Snapshot>(
    await fetch('/api/bootstrap', {
      headers: {
        'x-demo-role': role,
      },
    }),
  )

export const createBom = async (
  role: Role,
  payload: {
    productId: string
    revision: string
    notes: string
    lines: Array<{ componentProductId: string; quantity: number }>
  },
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/boms', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify(payload),
    }),
  )

export const createWorkOrder = async (
  role: Role,
  payload: {
    productId: string
    quantity: number
    dueDate: string
    priority: 'low' | 'medium' | 'high'
    notes: string
  },
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/work-orders', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify(payload),
    }),
  )

export const advanceWorkOrder = async (role: Role, workOrderId: string) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch(`/api/work-orders/${workOrderId}/advance`, {
      method: 'POST',
      headers: headersFor(role),
    }),
  )

export const createPurchaseOrderDraft = async (role: Role, sku: string) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/purchase-orders/from-alert', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify({ sku }),
    }),
  )

export const confirmPurchaseOrder = async (
  role: Role,
  purchaseOrderId: string,
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch(`/api/purchase-orders/${purchaseOrderId}/confirm`, {
      method: 'POST',
      headers: headersFor(role),
    }),
  )

export const createQualityLog = async (
  role: Role,
  payload: {
    workOrderId: string
    batchCode: string
    passedUnits: number
    failedUnits: number
    notes: string
  },
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/quality-logs', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify(payload),
    }),
  )

export const createSalesOrder = async (
  role: Role,
  payload: {
    clientId: string
    shippingAddress: string
    lineItems: Array<{ productId: string; quantity: number }>
  },
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/sales-orders', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify(payload),
    }),
  )

export const confirmSalesOrder = async (role: Role, salesOrderId: string) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch(`/api/sales-orders/${salesOrderId}/confirm`, {
      method: 'POST',
      headers: headersFor(role),
    }),
  )

export const createInvoice = async (
  role: Role,
  payload: {
    salesOrderId: string
    taxRate: number
    discountRate: number
    shippingFee: number
  },
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch('/api/invoices', {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify(payload),
    }),
  )

export const recordPayment = async (
  role: Role,
  invoiceId: string,
  amount: number,
) =>
  parseResponse<{ snapshot: Snapshot }>(
    await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: headersFor(role),
      body: JSON.stringify({ amount }),
    }),
  )

export const invoicePdfUrl = (invoiceId: string, role: Role) =>
  `/api/invoices/${invoiceId}/pdf?role=${role}`
