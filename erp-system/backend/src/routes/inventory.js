const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(sku, name, type, reorder_point, unit_cost), warehouses(name, code)')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select('*, products(name, sku, reorder_point), warehouses(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-reorder', async (req, res) => {
  try {
    const { data: inventoryItems } = await supabase
      .from('inventory')
      .select('*, products(id, name, sku, reorder_point)')
      .not('products', 'is', null);

    const alerts = [];
    for (const item of inventoryItems || []) {
      if (item.quantity_on_hand <= item.products.reorder_point) {
        const { data: existingAlert } = await supabase
          .from('inventory_alerts')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('warehouse_id', item.warehouse_id)
          .eq('status', 'active')
          .single();

        if (!existingAlert) {
          const { data: alert } = await supabase
            .from('inventory_alerts')
            .insert({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              alert_type: 'low_stock',
              message: `${item.products.name} (${item.products.sku}) is below reorder point. Current: ${item.quantity_on_hand}, Reorder at: ${item.products.reorder_point}`
            })
            .select()
            .single();

          alerts.push(alert);
        }
      }
    }

    res.json({ newAlerts: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/suggest-po', async (req, res) => {
  const { product_id, warehouse_id } = req.body;
  try {
    const { data: product } = await supabase
      .from('products')
      .select('*, inventory!inner(quantity_on_hand)')
      .eq('id', product_id)
      .single();

    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(1);

    const suggestedQuantity = Math.max((product?.reorder_point || 0) * 2 - (product?.inventory?.[0]?.quantity_on_hand || 0), 10);

    res.json({
      product,
      suggested_supplier: suppliers?.[0] || null,
      suggested_quantity: suggestedQuantity,
      estimated_cost: suggestedQuantity * Number(product?.unit_cost || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity_on_hand, quantity_reserved } = req.body;
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity_on_hand, quantity_reserved, updated_at: new Date().toISOString() })
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
