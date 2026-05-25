import PDFDocument from 'pdfkit'

export interface InvoicePdfLine {
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface InvoicePdfPayload {
  invoiceNumber: string
  createdAt: string
  clientName: string
  shippingAddress: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingFee: number
  total: number
  lines: InvoicePdfLine[]
}

export const buildInvoicePdf = (payload: InvoicePdfPayload): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 48 })
    const chunks: Buffer[] = []

    document.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)

    document.fontSize(24).text('Manufacturing ERP Invoice', { align: 'left' })
    document.moveDown(0.5)
    document.fontSize(11)
    document.text(`Invoice #: ${payload.invoiceNumber}`)
    document.text(
      `Issued: ${new Date(payload.createdAt).toLocaleDateString('en-US')}`,
    )
    document.text(`Bill To: ${payload.clientName}`)
    document.text(`Ship To: ${payload.shippingAddress}`)
    document.moveDown()

    document.fontSize(13).text('Line Items')
    document.moveDown(0.5)

    payload.lines.forEach((line) => {
      document
        .fontSize(10)
        .text(
          `${line.description}  |  Qty ${line.quantity}  |  Unit $${line.unitPrice.toFixed(
            2,
          )}  |  Total $${line.lineTotal.toFixed(2)}`,
        )
    })

    document.moveDown()
    document.fontSize(12).text(`Subtotal: $${payload.subtotal.toFixed(2)}`, {
      align: 'right',
    })
    document.text(`Discount: -$${payload.discountAmount.toFixed(2)}`, {
      align: 'right',
    })
    document.text(`Tax: $${payload.taxAmount.toFixed(2)}`, {
      align: 'right',
    })
    document.text(`Shipping: $${payload.shippingFee.toFixed(2)}`, {
      align: 'right',
    })
    document.moveDown(0.5)
    document.fontSize(14).text(`Total Due: $${payload.total.toFixed(2)}`, {
      align: 'right',
    })

    document.end()
  })
