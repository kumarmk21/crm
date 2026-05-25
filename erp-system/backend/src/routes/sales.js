const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customers(company_name), sales_order_lines(*, products(name, sku))')
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
      .from('sales_orders')
      .select('*, customers(*), sales_order_lines(*, products(name, sku, unit_cost))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { customer_id, deal_id, delivery_date, notes, lines, tax_rate = 0, discount_amount = 0, shipping_fee = 0 } = req.body;
  try {
    const { count } = await supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true });

    const soNumber = `SO-${String((count || 0) + 1).padStart(5, '0')}`;

    const subtotal = lines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100);
      return sum + lineTotal;
    }, 0);

    const taxAmount = subtotal * (tax_rate / 100);
    const totalAmount = subtotal + taxAmount - discount_amount + shipping_fee;

    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .insert({
        so_number: soNumber,
        customer_id, deal_id,
        delivery_date, notes,
        subtotal,
        tax_amount: taxAmount,
        discount_amount,
        shipping_fee,
        total_amount: totalAmount
      })
      .select()
      .single();

    if (soError) throw soError;

    const orderLines = lines.map(line => ({
      sales_order_id: salesOrder.id,
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent || 0,
      total_price: line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100)
    }));

    await supabase.from('sales_order_lines').insert(orderLines);

    const { data: fullOrder } = await supabase
      .from('sales_orders')
      .select('*, customers(company_name), sales_order_lines(*, products(name, sku))')
      .eq('id', salesOrder.id)
      .single();

    res.status(201).json(fullOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: order } = await supabase
      .from('sales_orders')
      .select('*, sales_order_lines(product_id, quantity)')
      .eq('id', id)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    for (const line of order.sales_order_lines) {
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('id, quantity_reserved')
        .eq('product_id', line.product_id)
        .order('quantity_on_hand', { ascending: false })
        .limit(1)
        .single();

      if (inventoryItem) {
        await supabase
          .from('inventory')
          .update({
            quantity_reserved: inventoryItem.quantity_reserved + line.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryItem.id);
      }
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, customers(company_name), sales_order_lines(*, products(name, sku))')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
