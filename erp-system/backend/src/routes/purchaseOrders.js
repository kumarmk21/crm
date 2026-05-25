const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(company_name), purchase_order_lines(*, products(name, sku))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { supplier_id, expected_delivery, notes, lines } = req.body;
  try {
    const { count } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true });

    const poNumber = `PO-${String((count || 0) + 1).padStart(5, '0')}`;
    const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.unit_price), 0);

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery,
        total_amount: totalAmount,
        notes
      })
      .select()
      .single();

    if (poError) throw poError;

    const poLines = lines.map(line => ({
      purchase_order_id: po.id,
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price
    }));

    await supabase.from('purchase_order_lines').insert(poLines);

    const { data: fullPo } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(company_name), purchase_order_lines(*, products(name, sku))')
      .eq('id', po.id)
      .single();

    res.status(201).json(fullPo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (!po) return res.status(404).json({ error: 'PO not found' });

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('accounts_payable')
      .insert({
        purchase_order_id: id,
        supplier_id: po.supplier_id,
        amount: po.total_amount,
        due_date: po.expected_delivery
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/receive', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*, purchase_order_lines(product_id, quantity)')
      .eq('id', id)
      .single();

    if (!po) return res.status(404).json({ error: 'PO not found' });

    for (const line of po.purchase_order_lines) {
      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('id, quantity_on_hand')
        .eq('product_id', line.product_id)
        .limit(1)
        .single();

      if (inventoryItem) {
        await supabase
          .from('inventory')
          .update({
            quantity_on_hand: inventoryItem.quantity_on_hand + line.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryItem.id);
      }
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'received', updated_at: new Date().toISOString() })
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
