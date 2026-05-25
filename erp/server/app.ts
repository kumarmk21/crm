import express, { type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'

import {
  ErpStore,
  type Permission,
  type Role,
  hasPermission,
} from './domain.js'
import { buildInvoicePdf } from './pdf.js'

const roleSchema = z.enum([
  'admin',
  'sales',
  'operations',
  'warehouse_manager',
  'accountant',
])

const bomSchema = z.object({
  productId: z.string().min(1),
  revision: z.string().min(1),
  notes: z.string().min(1),
  lines: z
    .array(
      z.object({
        componentProductId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
})

const workOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  dueDate: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().min(1),
})

const alertSchema = z.object({
  sku: z.string().min(1),
})

const qualitySchema = z.object({
  workOrderId: z.string().min(1),
  batchCode: z.string().min(1),
  passedUnits: z.number().int().min(0),
  failedUnits: z.number().int().min(0),
  notes: z.string().min(1),
})

const salesOrderSchema = z.object({
  clientId: z.string().min(1),
  shippingAddress: z.string().min(1),
  lineItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

const invoiceSchema = z.object({
  salesOrderId: z.string().min(1),
  taxRate: z.number().min(0).max(1),
  discountRate: z.number().min(0).max(1),
  shippingFee: z.number().min(0),
})

const paymentSchema = z.object({
  amount: z.number().positive(),
})

const getRequestRole = (request: Request): Role =>
  roleSchema.parse(
    request.header('x-demo-role') ??
      (typeof request.query.role === 'string' ? request.query.role : 'admin'),
  )

const getParam = (request: Request, key: string) => {
  const value = request.params[key]
  if (typeof value !== 'string') {
    throw new Error(`Missing route parameter: ${key}.`)
  }
  return value
}

const requirePermission =
  (permission: Permission) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const role = getRequestRole(request)
    if (!hasPermission(role, permission)) {
      next(new Error(`Role ${role} is not allowed to ${permission}.`))
      return
    }
    next()
  }

export const createApp = (store = new ErpStore()) => {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/bootstrap', requirePermission('dashboard.view'), (request, response) => {
    response.json(store.getSnapshot(getRequestRole(request)))
  })

  app.post('/api/boms', requirePermission('bom.manage'), (request, response) => {
    const payload = bomSchema.parse(request.body)
    const bom = store.addBom(payload)
    response.status(201).json({
      bom,
      snapshot: store.getSnapshot(getRequestRole(request)),
    })
  })

  app.post(
    '/api/work-orders',
    requirePermission('work_orders.manage'),
    (request, response) => {
      const payload = workOrderSchema.parse(request.body)
      const workOrder = store.createWorkOrder(payload)
      response.status(201).json({
        workOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/work-orders/:id/advance',
    requirePermission('work_orders.manage'),
    (request, response) => {
      const workOrder = store.advanceWorkOrder(getParam(request, 'id'))
      response.json({
        workOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/purchase-orders/from-alert',
    requirePermission('purchase_orders.manage'),
    (request, response) => {
      const payload = alertSchema.parse(request.body)
      const purchaseOrder = store.createPurchaseOrderFromAlert(payload.sku)
      response.status(201).json({
        purchaseOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/purchase-orders/:id/confirm',
    requirePermission('purchase_orders.manage'),
    (request, response) => {
      const purchaseOrder = store.confirmPurchaseOrder(getParam(request, 'id'))
      response.json({
        purchaseOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/quality-logs',
    requirePermission('quality_control.log'),
    (request, response) => {
      const payload = qualitySchema.parse(request.body)
      const qualityLog = store.logQualityCheck(payload)
      response.status(201).json({
        qualityLog,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/sales-orders',
    requirePermission('sales_orders.manage'),
    (request, response) => {
      const payload = salesOrderSchema.parse(request.body)
      const salesOrder = store.createSalesOrder(payload)
      response.status(201).json({
        salesOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/sales-orders/:id/confirm',
    requirePermission('sales_orders.manage'),
    (request, response) => {
      const salesOrder = store.confirmSalesOrder(getParam(request, 'id'))
      response.json({
        salesOrder,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/invoices',
    requirePermission('invoices.manage'),
    (request, response) => {
      const payload = invoiceSchema.parse(request.body)
      const invoice = store.createInvoice(payload)
      response.status(201).json({
        invoice,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.post(
    '/api/invoices/:id/payments',
    requirePermission('payments.record'),
    (request, response) => {
      const payload = paymentSchema.parse(request.body)
      const payment = store.recordPayment({
        invoiceId: getParam(request, 'id'),
        amount: payload.amount,
      })
      response.status(201).json({
        payment,
        snapshot: store.getSnapshot(getRequestRole(request)),
      })
    },
  )

  app.get(
    '/api/invoices/:id/pdf',
    requirePermission('invoices.manage'),
    async (request, response, next) => {
      try {
        const snapshot = store.getSnapshot(getRequestRole(request))
        const invoiceId = getParam(request, 'id')
        const invoice = snapshot.sales.invoices.find(
          (item) => item.id === invoiceId,
        )
        if (!invoice) {
          throw new Error(`Invoice ${invoiceId} was not found.`)
        }
        const salesOrder = snapshot.sales.salesOrders.find(
          (item) => item.id === invoice.salesOrderId,
        )
        if (!salesOrder) {
          throw new Error(`Sales order ${invoice.salesOrderId} was not found.`)
        }
        const products = snapshot.masterData.products
        const pdf = await buildInvoicePdf({
          invoiceNumber: invoice.invoiceNumber,
          createdAt: invoice.createdAt,
          clientName: invoice.clientName,
          shippingAddress: salesOrder.shippingAddress,
          subtotal: invoice.subtotal,
          discountAmount: invoice.discountAmount,
          taxAmount: invoice.taxAmount,
          shippingFee: invoice.shippingFee,
          total: invoice.total,
          lines: salesOrder.lineItems.map((line) => {
            const product = products.find((item) => item.id === line.productId)
            return {
              description: product?.name ?? line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.quantity * line.unitPrice,
            }
          }),
        })

        response.setHeader('Content-Type', 'application/pdf')
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        )
        response.send(pdf)
      } catch (error) {
        next(error)
      }
    },
  )

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      void next
      const message =
        error instanceof Error ? error.message : 'Unexpected server error.'
      response.status(400).json({ message })
    },
  )

  return app
}
