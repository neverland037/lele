const db = require('../config/database');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const postsController = {
  getPosts(req, res) {
    try {
      const posts = db.queryAll('SELECT id, title, slug, excerpt, cover_image, category, published_date, views, created_at FROM posts WHERE is_published = 1 ORDER BY id DESC');
      res.json({ success: true, posts });
    } catch (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ success: false, message: 'Error al obtener artículos.' });
    }
  },

  getPostBySlug(req, res) {
    try {
      const { slug } = req.params;
      const post = db.queryOne('SELECT * FROM posts WHERE (slug = ? OR id = ?) AND is_published = 1', [slug, isNaN(slug) ? -1 : parseInt(slug)]);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado.' });
      }

      // Increment views counter
      db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);

      res.json({ success: true, post });
    } catch (err) {
      console.error('Error fetching post:', err);
      res.status(500).json({ success: false, message: 'Error al obtener el artículo.' });
    }
  },

  adminGetPosts(req, res) {
    try {
      const posts = db.queryAll('SELECT * FROM posts ORDER BY id DESC');
      res.json({ success: true, posts });
    } catch (err) {
      console.error('Error fetching admin posts:', err);
      res.status(500).json({ success: false, message: 'Error al obtener artículos.' });
    }
  },

  createPost(req, res) {
    const { title, excerpt, content, cover_image, category, is_published, published_date } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Título y contenido son requeridos.' });
    }

    try {
      let baseSlug = slugify(title);
      let slug = baseSlug;
      let counter = 1;
      while (db.queryOne('SELECT id FROM posts WHERE slug = ?', [slug])) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const published = is_published === undefined ? 1 : (is_published ? 1 : 0);
      const pubDate = published_date || new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

      const result = db.run(`
        INSERT INTO posts (
          title, slug, excerpt, content, cover_image, category, is_published, published_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title.trim(),
        slug,
        excerpt || '',
        content,
        cover_image || 'img/thumb-1.jpg',
        category || 'Marketing',
        published,
        pubDate
      ]);

      const created = db.queryOne('SELECT * FROM posts WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ success: true, message: 'Artículo creado exitosamente.', post: created });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ success: false, message: 'Error al crear artículo.' });
    }
  },

  updatePost(req, res) {
    const { id } = req.params;
    const { title, slug, excerpt, content, cover_image, category, is_published, published_date } = req.body;

    try {
      const existing = db.queryOne('SELECT * FROM posts WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado.' });
      }

      let finalSlug = existing.slug;
      if (slug && slug !== existing.slug) {
        finalSlug = slugify(slug);
        const duplicate = db.queryOne('SELECT id FROM posts WHERE slug = ? AND id != ?', [finalSlug, id]);
        if (duplicate) {
          finalSlug = `${finalSlug}-${Date.now()}`;
        }
      }

      const published = is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published;

      db.run(`
        UPDATE posts SET
          title = COALESCE(?, title),
          slug = ?,
          excerpt = COALESCE(?, excerpt),
          content = COALESCE(?, content),
          cover_image = COALESCE(?, cover_image),
          category = COALESCE(?, category),
          is_published = ?,
          published_date = COALESCE(?, published_date),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title ? title.trim() : existing.title,
        finalSlug,
        excerpt,
        content,
        cover_image,
        category,
        published,
        published_date,
        id
      ]);

      const updated = db.queryOne('SELECT * FROM posts WHERE id = ?', [id]);
      res.json({ success: true, message: 'Artículo actualizado exitosamente.', post: updated });
    } catch (err) {
      console.error('Error updating post:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar artículo.' });
    }
  },

  deletePost(req, res) {
    const { id } = req.params;
    try {
      const existing = db.queryOne('SELECT * FROM posts WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Artículo no encontrado.' });
      }

      db.run('DELETE FROM posts WHERE id = ?', [id]);
      res.json({ success: true, message: 'Artículo eliminado exitosamente.' });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ success: false, message: 'Error al eliminar artículo.' });
    }
  }
};

module.exports = postsController;
