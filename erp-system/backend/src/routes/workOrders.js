const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, products(name, sku), bom(name, version), assigned:employees(first_name, last_name), warehouses(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/kanban', async (req, res) => {
  try {
    const statuses = ['planned', 'in_production', 'quality_check', 'completed'];
    const result = {};

    for (const status of statuses) {
      const { data } = await supabase
        .from('work_orders')
        .select('*, products(name, sku), assigned:employees(first_name, last_name)')
        .eq('status', status)
        .order('updated_at', { ascending: false });

      result[status] = data || [];
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { product_id, bom_id, quantity, planned_start, planned_end, assigned_to, warehouse_id, notes } = req.body;
  try {
    const { count } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true });

    const orderNumber = `WO-${String((count || 0) + 1).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        order_number: orderNumber,
        product_id, bom_id, quantity,
        planned_start, planned_end,
        assigned_to, warehouse_id, notes
      })
      .select('*, products(name, sku), bom(name)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateData = { status, updated_at: new Date().toISOString() };

    if (status === 'in_production') {
      updateData.actual_start = new Date().toISOString();
    }

    if (status === 'completed') {
      updateData.actual_end = new Date().toISOString();

      const { data: workOrder } = await supabase
        .from('work_orders')
        .select('*, bom(bom_lines(component_id, quantity))')
        .eq('id', id)
        .single();

      if (workOrder?.bom?.bom_lines) {
        for (const line of workOrder.bom.bom_lines) {
          const decrementQty = Math.ceil(line.quantity * workOrder.quantity);

          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('id, quantity_on_hand')
            .eq('product_id', line.component_id)
            .eq('warehouse_id', workOrder.warehouse_id)
            .single();

          if (inventoryItem) {
            const newQty = Math.max(0, inventoryItem.quantity_on_hand - decrementQty);
            await supabase
              .from('inventory')
              .update({ quantity_on_hand: newQty, updated_at: new Date().toISOString() })
              .eq('id', inventoryItem.id);
          }
        }

        const { data: finishedInventory } = await supabase
          .from('inventory')
          .select('id, quantity_on_hand')
          .eq('product_id', workOrder.product_id)
          .eq('warehouse_id', workOrder.warehouse_id)
          .single();

        if (finishedInventory) {
          await supabase
            .from('inventory')
            .update({
              quantity_on_hand: finishedInventory.quantity_on_hand + workOrder.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', finishedInventory.id);
        } else {
          await supabase
            .from('inventory')
            .insert({
              product_id: workOrder.product_id,
              warehouse_id: workOrder.warehouse_id,
              quantity_on_hand: workOrder.quantity
            });
        }
      }
    }

    const { data, error } = await supabase
      .from('work_orders')
      .update(updateData)
      .eq('id', id)
      .select('*, products(name, sku), assigned:employees(first_name, last_name)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .update({ ...req.body, updated_at: new Date().toISOString() })
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
