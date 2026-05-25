const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/chart-of-accounts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .order('account_code');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/journal-entries', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, journal_entry_lines(*, chart_of_accounts(account_code, name, category))')
      .order('entry_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/journal-entries', async (req, res) => {
  const { description, reference_type, reference_id, lines } = req.body;
  try {
    const totalDebits = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredits = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ error: 'Debits must equal credits' });
    }

    const { count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true });

    const entryNumber = `JE-${String((count || 0) + 1).padStart(5, '0')}`;

    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({ entry_number: entryNumber, description, reference_type, reference_id, is_posted: true })
      .select()
      .single();

    if (entryError) throw entryError;

    const entryLines = lines.map(line => ({
      journal_entry_id: entry.id,
      account_id: line.account_id,
      debit: line.debit || 0,
      credit: line.credit || 0,
      description: line.description
    }));

    await supabase.from('journal_entry_lines').insert(entryLines);

    const { data: fullEntry } = await supabase
      .from('journal_entries')
      .select('*, journal_entry_lines(*, chart_of_accounts(account_code, name, category))')
      .eq('id', entry.id)
      .single();

    res.status(201).json(fullEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/accounts-payable', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*, suppliers(company_name), purchase_orders(po_number)')
      .order('due_date');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/accounts-receivable', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*, customers(company_name), invoices(invoice_number)')
      .order('due_date');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/income-statement', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    let query = supabase
      .from('journal_entry_lines')
      .select('debit, credit, chart_of_accounts!inner(account_code, name, category), journal_entries!inner(entry_date, is_posted)')
      .eq('journal_entries.is_posted', true);

    if (start_date) query = query.gte('journal_entries.entry_date', start_date);
    if (end_date) query = query.lte('journal_entries.entry_date', end_date);

    const { data, error } = await query;
    if (error) throw error;

    const revenue = { total: 0, accounts: {} };
    const expenses = { total: 0, accounts: {} };

    for (const line of data || []) {
      const account = line.chart_of_accounts;
      if (account.category === 'revenue') {
        const amount = Number(line.credit) - Number(line.debit);
        revenue.total += amount;
        revenue.accounts[account.name] = (revenue.accounts[account.name] || 0) + amount;
      } else if (account.category === 'expense') {
        const amount = Number(line.debit) - Number(line.credit);
        expenses.total += amount;
        expenses.accounts[account.name] = (expenses.accounts[account.name] || 0) + amount;
      }
    }

    res.json({
      revenue,
      expenses,
      netIncome: revenue.total - expenses.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance-sheet', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select('debit, credit, chart_of_accounts!inner(account_code, name, category), journal_entries!inner(is_posted)')
      .eq('journal_entries.is_posted', true);

    if (error) throw error;

    const balances = { assets: {}, liabilities: {}, equity: {} };
    const totals = { assets: 0, liabilities: 0, equity: 0 };

    for (const line of data || []) {
      const account = line.chart_of_accounts;
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (account.category === 'asset') {
        const amount = debit - credit;
        balances.assets[account.name] = (balances.assets[account.name] || 0) + amount;
        totals.assets += amount;
      } else if (account.category === 'liability') {
        const amount = credit - debit;
        balances.liabilities[account.name] = (balances.liabilities[account.name] || 0) + amount;
        totals.liabilities += amount;
      } else if (account.category === 'equity') {
        const amount = credit - debit;
        balances.equity[account.name] = (balances.equity[account.name] || 0) + amount;
        totals.equity += amount;
      }
    }

    res.json({ balances, totals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cash-flow', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    let query = supabase
      .from('journal_entry_lines')
      .select('debit, credit, description, chart_of_accounts!inner(account_code, name, category), journal_entries!inner(entry_date, description, is_posted)')
      .eq('journal_entries.is_posted', true)
      .eq('chart_of_accounts.account_code', '1000');

    if (start_date) query = query.gte('journal_entries.entry_date', start_date);
    if (end_date) query = query.lte('journal_entries.entry_date', end_date);

    const { data, error } = await query;
    if (error) throw error;

    let cashInflows = 0;
    let cashOutflows = 0;
    const transactions = [];

    for (const line of data || []) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (debit > 0) {
        cashInflows += debit;
        transactions.push({ type: 'inflow', amount: debit, description: line.journal_entries?.description || line.description });
      }
      if (credit > 0) {
        cashOutflows += credit;
        transactions.push({ type: 'outflow', amount: credit, description: line.journal_entries?.description || line.description });
      }
    }

    res.json({
      cashInflows,
      cashOutflows,
      netCashFlow: cashInflows - cashOutflows,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
