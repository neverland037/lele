const db = require('../config/database');

const dashboardController = {
  getStats(req, res) {
    try {
      const totalProjects = db.queryOne('SELECT COUNT(*) as count FROM projects')?.count || 0;
      const totalPosts = db.queryOne('SELECT COUNT(*) as count FROM posts')?.count || 0;
      const totalSkills = db.queryOne('SELECT COUNT(*) as count FROM skills')?.count || 0;
      const totalMessages = db.queryOne('SELECT COUNT(*) as count FROM messages')?.count || 0;
      const unreadMessages = db.queryOne('SELECT COUNT(*) as count FROM messages WHERE is_read = 0')?.count || 0;

      const recentMessages = db.queryAll('SELECT id, name, email, message, is_read, created_at FROM messages ORDER BY id DESC LIMIT 5');
      const recentProjects = db.queryAll('SELECT id, title, category_label, cover_image, created_at FROM projects ORDER BY id DESC LIMIT 5');

      res.json({
        success: true,
        stats: {
          totalProjects,
          totalPosts,
          totalSkills,
          totalMessages,
          unreadMessages
        },
        recentMessages,
        recentProjects
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ success: false, message: 'Error al obtener estadísticas del dashboard.' });
    }
  }
};

module.exports = dashboardController;
