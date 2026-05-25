const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const PDFDocument = require('pdfkit');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(company_name), sales_orders(so_number)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(*), sales_orders(*, sales_order_lines(*, products(name, sku)))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', async (req, res) => {
  const { sales_order_id, tax_rate = 0, discount_amount = 0, shipping_fee = 0, due_days = 30 } = req.body;
  try {
    const { data: order } = await supabase
      .from('sales_orders')
      .select('*, customers(*), sales_order_lines(*, products(name, sku))')
      .eq('id', sales_order_id)
      .single();

    if (!order) return res.status(404).json({ error: 'Sales order not found' });

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(5, '0')}`;

    const subtotal = order.subtotal;
    const taxAmount = subtotal * (tax_rate / 100);
    const totalAmount = subtotal + taxAmount - discount_amount + shipping_fee;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + due_days);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        sales_order_id,
        customer_id: order.customer_id,
        subtotal,
        tax_rate: tax_rate,
        tax_amount: taxAmount,
        discount_amount: discount_amount,
        shipping_fee,
        total_amount: totalAmount,
        due_date: dueDate.toISOString().split('T')[0]
      })
      .select('*, customers(company_name)')
      .single();

    if (error) throw error;

    await supabase
      .from('accounts_receivable')
      .insert({
        invoice_id: invoice.id,
        customer_id: order.customer_id,
        amount: totalAmount,
        due_date: dueDate.toISOString().split('T')[0]
      });

    const { data: revenueAccount } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('account_code', '4000')
      .single();

    const { data: arAccount } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('account_code', '1100')
      .single();

    if (revenueAccount && arAccount) {
      const { count: jeCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true });

      const entryNumber = `JE-${String((jeCount || 0) + 1).padStart(5, '0')}`;

      const { data: je } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          description: `Revenue from invoice ${invoiceNumber}`,
          reference_type: 'invoice',
          reference_id: invoice.id,
          is_posted: true
        })
        .select()
        .single();

      await supabase.from('journal_entry_lines').insert([
        { journal_entry_id: je.id, account_id: arAccount.id, debit: totalAmount, credit: 0 },
        { journal_entry_id: je.id, account_id: revenueAccount.id, debit: 0, credit: totalAmount }
      ]);
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, customers(*), sales_orders(*, sales_order_lines(*, products(name, sku)))')
      .eq('id', req.params.id)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_number}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${invoice.invoice_number}`);
    doc.text(`Date: ${invoice.issue_date}`);
    doc.text(`Due Date: ${invoice.due_date}`);
    doc.moveDown();

    doc.fontSize(14).text('Bill To:');
    doc.fontSize(11);
    doc.text(invoice.customers?.company_name || '');
    doc.text(invoice.customers?.address_line1 || '');
    doc.text(`${invoice.customers?.city || ''}, ${invoice.customers?.state || ''} ${invoice.customers?.postal_code || ''}`);
    doc.moveDown();

    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    const lines = invoice.sales_orders?.sales_order_lines || [];
    for (const line of lines) {
      doc.fontSize(10).text(
        `${line.products?.name || 'Item'} (${line.products?.sku || ''}) - Qty: ${line.quantity} x $${line.unit_price} = $${line.total_price}`,
        { indent: 20 }
      );
    }

    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Subtotal: $${Number(invoice.subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (${invoice.tax_rate}%): $${Number(invoice.tax_amount).toFixed(2)}`, { align: 'right' });
    doc.text(`Discount: -$${Number(invoice.discount_amount).toFixed(2)}`, { align: 'right' });
    doc.text(`Shipping: $${Number(invoice.shipping_fee).toFixed(2)}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Total: $${Number(invoice.total_amount).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(9).text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/pay', async (req, res) => {
  const { amount } = req.body;
  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const newAmountPaid = Number(invoice.amount_paid) + amount;
    const newStatus = newAmountPaid >= Number(invoice.total_amount) ? 'paid' : invoice.status;

    const { data, error } = await supabase
      .from('invoices')
      .update({ amount_paid: newAmountPaid, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('accounts_receivable')
      .update({
        amount_received: newAmountPaid,
        status: newAmountPaid >= Number(invoice.total_amount) ? 'paid' : 'partial',
        received_date: newAmountPaid >= Number(invoice.total_amount) ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
      })
      .eq('invoice_id', req.params.id);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
