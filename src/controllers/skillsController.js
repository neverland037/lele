const db = require('../config/database');

const skillsController = {
  getSkills(req, res) {
    try {
      const skills = db.queryAll('SELECT * FROM skills ORDER BY order_index ASC, id ASC');
      res.json({ success: true, skills });
    } catch (err) {
      console.error('Error fetching skills:', err);
      res.status(500).json({ success: false, message: 'Error al obtener habilidades.' });
    }
  },

  createSkill(req, res) {
    const { name, percentage, category, order_index } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre de la habilidad es requerido.' });
    }

    try {
      const pct = Math.min(100, Math.max(0, parseInt(percentage) || 50));
      const order = parseInt(order_index) || 0;
      const cat = category ? category.trim() : 'Diseño';

      const result = db.run(
        'INSERT INTO skills (name, percentage, category, order_index) VALUES (?, ?, ?, ?)',
        [name.trim(), pct, cat, order]
      );

      const newSkill = db.queryOne('SELECT * FROM skills WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ success: true, message: 'Habilidad creada.', skill: newSkill });
    } catch (err) {
      console.error('Error creating skill:', err);
      res.status(500).json({ success: false, message: 'Error al crear habilidad.' });
    }
  },

  updateSkill(req, res) {
    const { id } = req.params;
    const { name, percentage, category, order_index } = req.body;

    try {
      const existing = db.queryOne('SELECT * FROM skills WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Habilidad no encontrada.' });
      }

      const pct = percentage !== undefined ? Math.min(100, Math.max(0, parseInt(percentage))) : existing.percentage;
      const order = order_index !== undefined ? parseInt(order_index) : existing.order_index;
      const skillName = name ? name.trim() : existing.name;
      const cat = category ? category.trim() : existing.category;

      db.run(
        'UPDATE skills SET name = ?, percentage = ?, category = ?, order_index = ? WHERE id = ?',
        [skillName, pct, cat, order, id]
      );

      const updated = db.queryOne('SELECT * FROM skills WHERE id = ?', [id]);
      res.json({ success: true, message: 'Habilidad actualizada.', skill: updated });
    } catch (err) {
      console.error('Error updating skill:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar habilidad.' });
    }
  },

  deleteSkill(req, res) {
    const { id } = req.params;
    try {
      const existing = db.queryOne('SELECT * FROM skills WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Habilidad no encontrada.' });
      }

      db.run('DELETE FROM skills WHERE id = ?', [id]);
      res.json({ success: true, message: 'Habilidad eliminada correctamente.' });
    } catch (err) {
      console.error('Error deleting skill:', err);
      res.status(500).json({ success: false, message: 'Error al eliminar habilidad.' });
    }
  }
};

module.exports = skillsController;
