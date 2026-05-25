import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from './app.js'
import { ErpStore } from './domain.js'

const adminHeaders = {
  'x-demo-role': 'admin',
}

describe('ERP workflow API', () => {
  it('completes a work order and consumes BOM inventory', async () => {
    const app = createApp(new ErpStore())

    const response = await request(app)
      .post('/api/work-orders/wo-1003/advance')
      .set(adminHeaders)
      .send()
      .expect(200)

    const steelRecord = response.body.snapshot.operations.inventory.find(
      (item: { sku: string; stockLevel: number }) => item.sku === 'RM-STEEL-01',
    )
    const finishedRecord = response.body.snapshot.operations.inventory.find(
      (item: { sku: string; stockLevel: number }) => item.sku === 'FG-PUMP-X100',
    )

    expect(response.body.workOrder.stage).toBe('completed')
    expect(steelRecord.stockLevel).toBe(8)
    expect(finishedRecord.stockLevel).toBe(21)
  })

  it('confirms a sales order and reserves stock', async () => {
    const app = createApp(new ErpStore())

    const response = await request(app)
      .post('/api/sales-orders/so-1002/confirm')
      .set(adminHeaders)
      .send()
      .expect(200)

    const panelRecord = response.body.snapshot.operations.inventory.find(
      (item: { sku: string; reservedStock: number }) => item.sku === 'FG-PANEL-A5',
    )

    expect(response.body.salesOrder.status).toBe('confirmed')
    expect(panelRecord.reservedStock).toBe(4)
  })

  it('creates and confirms a purchase order from a low-stock alert', async () => {
    const app = createApp(new ErpStore())

    const draftResponse = await request(app)
      .post('/api/purchase-orders/from-alert')
      .set(adminHeaders)
      .send({ sku: 'RM-STEEL-01' })
      .expect(201)

    const confirmResponse = await request(app)
      .post(`/api/purchase-orders/${draftResponse.body.purchaseOrder.id}/confirm`)
      .set(adminHeaders)
      .send()
      .expect(200)

    const steelRecord = confirmResponse.body.snapshot.operations.inventory.find(
      (item: { sku: string; stockLevel: number }) => item.sku === 'RM-STEEL-01',
    )
    const apRecord = confirmResponse.body.snapshot.finance.accountsPayable.find(
      (item: { id: string }) => item.id === draftResponse.body.purchaseOrder.id,
    )

    expect(confirmResponse.body.purchaseOrder.status).toBe('confirmed')
    expect(steelRecord.stockLevel).toBe(48)
    expect(apRecord.amount).toBe(540)
  })

  it('creates an invoice, records payment, and serves a PDF', async () => {
    const app = createApp(new ErpStore())

    const invoiceResponse = await request(app)
      .post('/api/invoices')
      .set(adminHeaders)
      .send({
        salesOrderId: 'so-1001',
        taxRate: 0.08,
        discountRate: 0.03,
        shippingFee: 60,
      })
      .expect(201)

    const paymentResponse = await request(app)
      .post(`/api/invoices/${invoiceResponse.body.invoice.id}/payments`)
      .set(adminHeaders)
      .send({ amount: invoiceResponse.body.invoice.total })
      .expect(201)

    expect(paymentResponse.body.snapshot.finance.accountsReceivable[0].outstandingAmount).toBe(
      0,
    )

    await request(app)
      .get(`/api/invoices/${invoiceResponse.body.invoice.id}/pdf`)
      .set(adminHeaders)
      .expect(200)
      .expect('Content-Type', /pdf/)
  })
})
