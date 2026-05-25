const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bom')
      .select('*, products(name, sku, type), bom_lines(*, component:products(name, sku, type, unit_cost))')
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
      .from('bom')
      .select('*, products(name, sku, type), bom_lines(*, component:products(name, sku, type, unit_cost, unit_of_measure))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { product_id, name, version, notes, lines } = req.body;
  try {
    const { data: bom, error: bomError } = await supabase
      .from('bom')
      .insert({ product_id, name, version, notes })
      .select()
      .single();

    if (bomError) throw bomError;

    if (lines && lines.length > 0) {
      const bomLines = lines.map(line => ({
        bom_id: bom.id,
        component_id: line.component_id,
        quantity: line.quantity,
        unit_of_measure: line.unit_of_measure || 'pcs',
        notes: line.notes
      }));

      const { error: lineError } = await supabase
        .from('bom_lines')
        .insert(bomLines);

      if (lineError) throw lineError;
    }

    const { data: fullBom } = await supabase
      .from('bom')
      .select('*, products(name, sku), bom_lines(*, component:products(name, sku, type, unit_cost))')
      .eq('id', bom.id)
      .single();

    res.status(201).json(fullBom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, version, notes, is_active, lines } = req.body;
  try {
    const { data: bom, error } = await supabase
      .from('bom')
      .update({ name, version, notes, is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (lines) {
      await supabase.from('bom_lines').delete().eq('bom_id', bom.id);

      const bomLines = lines.map(line => ({
        bom_id: bom.id,
        component_id: line.component_id,
        quantity: line.quantity,
        unit_of_measure: line.unit_of_measure || 'pcs',
        notes: line.notes
      }));

      await supabase.from('bom_lines').insert(bomLines);
    }

    const { data: fullBom } = await supabase
      .from('bom')
      .select('*, products(name, sku), bom_lines(*, component:products(name, sku, type, unit_cost))')
      .eq('id', bom.id)
      .single();

    res.json(fullBom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('bom')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'BOM deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
