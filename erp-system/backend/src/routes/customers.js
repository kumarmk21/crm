const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('company_name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, sales_orders(id, so_number, status, total_amount), invoices(id, invoice_number, status, total_amount)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Customer deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
