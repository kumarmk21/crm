const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quality_checks')
      .select('*, work_orders(order_number, products(name, sku)), inspector:employees(first_name, last_name)')
      .order('checked_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { work_order_id, inspector_id, batch_number, quantity_inspected, quantity_passed, quantity_failed, result, defect_description, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('quality_checks')
      .insert({
        work_order_id, inspector_id, batch_number,
        quantity_inspected, quantity_passed, quantity_failed,
        result, defect_description, notes
      })
      .select('*, work_orders(order_number)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { data } = await supabase
      .from('quality_checks')
      .select('result, quantity_inspected, quantity_passed, quantity_failed');

    const stats = {
      totalInspections: data?.length || 0,
      totalInspected: 0,
      totalPassed: 0,
      totalFailed: 0,
      passRate: 0
    };

    for (const check of data || []) {
      stats.totalInspected += check.quantity_inspected;
      stats.totalPassed += check.quantity_passed;
      stats.totalFailed += check.quantity_failed;
    }

    stats.passRate = stats.totalInspected > 0
      ? ((stats.totalPassed / stats.totalInspected) * 100).toFixed(1)
      : 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
