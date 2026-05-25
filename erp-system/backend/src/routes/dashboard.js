const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/kpis', async (req, res) => {
  try {
    const { data: revenue } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid');

    const totalRevenue = (revenue || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    const { count: pendingOrders } = await supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'confirmed', 'processing']);

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('quantity_on_hand, products(unit_cost)')
      .gt('quantity_on_hand', 0);

    const inventoryValue = (inventoryData || []).reduce(
      (sum, item) => sum + (item.quantity_on_hand * Number(item.products?.unit_cost || 0)), 0
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: expenses } = await supabase
      .from('journal_entry_lines')
      .select('debit, journal_entries!inner(entry_date, is_posted)')
      .gte('journal_entries.entry_date', startOfMonth.toISOString().split('T')[0])
      .eq('journal_entries.is_posted', true);

    const { data: expenseAccounts } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('category', 'expense');

    const expenseAccountIds = (expenseAccounts || []).map(a => a.id);
    const monthlyExpenses = (expenses || [])
      .filter(line => expenseAccountIds.includes(line.account_id))
      .reduce((sum, line) => sum + Number(line.debit), 0);

    res.json({
      totalRevenue,
      pendingOrders: pendingOrders || 0,
      inventoryValue,
      monthlyExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recent-orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customers(company_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventory-alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select('*, products(name, sku), warehouses(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
