const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*, customers(company_name, contact_name), assigned:employees(first_name, last_name)')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pipeline', async (req, res) => {
  try {
    const stages = ['lead', 'quotation', 'negotiation', 'won', 'lost'];
    const result = {};

    for (const stage of stages) {
      const { data } = await supabase
        .from('crm_deals')
        .select('*, customers(company_name)')
        .eq('stage', stage)
        .order('updated_at', { ascending: false });

      result[stage] = data || [];
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { customer_id, title, value, stage, probability, expected_close_date, assigned_to, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('crm_deals')
      .insert({ customer_id, title, value, stage, probability, expected_close_date, assigned_to, notes })
      .select('*, customers(company_name)')
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
      .from('crm_deals')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, customers(company_name)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/stage', async (req, res) => {
  const { stage } = req.body;
  try {
    const { data, error } = await supabase
      .from('crm_deals')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, customers(company_name)')
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
      .from('crm_deals')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
