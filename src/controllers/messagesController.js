const db = require('../config/database');

const messagesController = {
  sendMessage(req, res) {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Por favor ingrese un correo electrónico válido.' });
    }

    try {
      const result = db.run(
        'INSERT INTO messages (name, email, message, is_read) VALUES (?, ?, ?, 0)',
        [name.trim(), email.trim().toLowerCase(), message.trim()]
      );

      res.status(201).json({
        success: true,
        message: '¡Mensaje enviado con éxito! Gracias por contactarme.',
        id: result.lastInsertRowid
      });
    } catch (err) {
      console.error('Error saving contact message:', err);
      res.status(500).json({ success: false, message: 'Hubo un error al enviar el mensaje.' });
    }
  },

  getMessages(req, res) {
    try {
      const messages = db.queryAll('SELECT * FROM messages ORDER BY id DESC');
      const unreadCount = db.queryOne('SELECT COUNT(*) as count FROM messages WHERE is_read = 0')?.count || 0;
      res.json({ success: true, messages, unreadCount });
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ success: false, message: 'Error al obtener mensajes.' });
    }
  },

  markAsRead(req, res) {
    const { id } = req.params;
    const { is_read } = req.body;
    try {
      const readState = is_read === undefined ? 1 : (is_read ? 1 : 0);
      db.run('UPDATE messages SET is_read = ? WHERE id = ?', [readState, id]);
      res.json({ success: true, message: 'Estado actualizado.' });
    } catch (err) {
      console.error('Error updating message status:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar mensaje.' });
    }
  },

  deleteMessage(req, res) {
    const { id } = req.params;
    try {
      db.run('DELETE FROM messages WHERE id = ?', [id]);
      res.json({ success: true, message: 'Mensaje eliminado correctamente.' });
    } catch (err) {
      console.error('Error deleting message:', err);
      res.status(500).json({ success: false, message: 'Error al eliminar mensaje.' });
    }
  }
};

module.exports = messagesController;
