const db = require('../config/database');

const projectsController = {
  getProjects(req, res) {
    try {
      const { category } = req.query;
      let sql = 'SELECT * FROM projects';
      const params = [];

      if (category && category !== 'all') {
        sql += ' WHERE category_tag = ?';
        params.push(category);
      }

      sql += ' ORDER BY order_index ASC, id DESC';
      const projects = db.queryAll(sql, params).map(p => ({
        ...p,
        images: JSON.parse(p.images_json || '[]')
      }));

      res.json({ success: true, projects });
    } catch (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ success: false, message: 'Error al obtener proyectos.' });
    }
  },

  getProject(req, res) {
    try {
      const { id } = req.params;
      const project = db.queryOne('SELECT * FROM projects WHERE id = ?', [id]);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
      }

      res.json({
        success: true,
        project: {
          ...project,
          images: JSON.parse(project.images_json || '[]')
        }
      });
    } catch (err) {
      console.error('Error fetching project:', err);
      res.status(500).json({ success: false, message: 'Error al obtener proyecto.' });
    }
  },

  createProject(req, res) {
    const {
      title, category_tag, category_label, description, client_name,
      live_url, cover_image, images, is_featured, order_index
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'El título del proyecto es requerido.' });
    }

    try {
      const tag = (category_tag || 'branding').toLowerCase().trim();
      let label = category_label;
      if (!label) {
        if (tag === 'promo') label = 'MATERIAL PROMOCIONAL';
        else if (tag === 'web') label = 'SITIOS WEB';
        else label = 'IDENTIDAD DE MARCA';
      }

      const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]');
      const order = parseInt(order_index) || 0;
      const featured = is_featured === undefined ? 1 : (is_featured ? 1 : 0);

      const result = db.run(`
        INSERT INTO projects (
          title, category_tag, category_label, description, client_name,
          live_url, cover_image, images_json, is_featured, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title.trim(), tag, label, description || '', client_name || '',
        live_url || '', cover_image || 'img/thumb-1.jpg', imagesJson, featured, order
      ]);

      const created = db.queryOne('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({
        success: true,
        message: 'Proyecto creado exitosamente.',
        project: {
          ...created,
          images: JSON.parse(created.images_json || '[]')
        }
      });
    } catch (err) {
      console.error('Error creating project:', err);
      res.status(500).json({ success: false, message: 'Error al crear proyecto.' });
    }
  },

  updateProject(req, res) {
    const { id } = req.params;
    const {
      title, category_tag, category_label, description, client_name,
      live_url, cover_image, images, is_featured, order_index
    } = req.body;

    try {
      const existing = db.queryOne('SELECT * FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
      }

      const tag = category_tag !== undefined ? category_tag.toLowerCase().trim() : existing.category_tag;
      let label = category_label !== undefined ? category_label : existing.category_label;
      if (!label && category_tag) {
        if (tag === 'promo') label = 'MATERIAL PROMOCIONAL';
        else if (tag === 'web') label = 'SITIOS WEB';
        else label = 'IDENTIDAD DE MARCA';
      }

      const imagesJson = images !== undefined ? (Array.isArray(images) ? JSON.stringify(images) : images) : existing.images_json;
      const order = order_index !== undefined ? parseInt(order_index) : existing.order_index;
      const featured = is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured;

      db.run(`
        UPDATE projects SET
          title = COALESCE(?, title),
          category_tag = ?,
          category_label = ?,
          description = COALESCE(?, description),
          client_name = COALESCE(?, client_name),
          live_url = COALESCE(?, live_url),
          cover_image = COALESCE(?, cover_image),
          images_json = ?,
          is_featured = ?,
          order_index = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title ? title.trim() : existing.title,
        tag,
        label,
        description,
        client_name,
        live_url,
        cover_image,
        imagesJson,
        featured,
        order,
        id
      ]);

      const updated = db.queryOne('SELECT * FROM projects WHERE id = ?', [id]);
      res.json({
        success: true,
        message: 'Proyecto actualizado exitosamente.',
        project: {
          ...updated,
          images: JSON.parse(updated.images_json || '[]')
        }
      });
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar proyecto.' });
    }
  },

  deleteProject(req, res) {
    const { id } = req.params;
    try {
      const existing = db.queryOne('SELECT * FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado.' });
      }

      db.run('DELETE FROM projects WHERE id = ?', [id]);
      res.json({ success: true, message: 'Proyecto eliminado exitosamente.' });
    } catch (err) {
      console.error('Error deleting project:', err);
      res.status(500).json({ success: false, message: 'Error al eliminar proyecto.' });
    }
  },

  uploadImage(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
    }
    const relativePath = `uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Imagen subida correctamente.',
      filePath: relativePath,
      url: `/${relativePath}`
    });
  }
};

module.exports = projectsController;
