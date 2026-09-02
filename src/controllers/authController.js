const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');

const authController = {
  login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos.' });
    }

    try {
      const user = db.queryOne('SELECT * FROM users WHERE username = ?', [username.trim()]);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  },

  getMe(req, res) {
    try {
      const user = db.queryOne('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error al obtener usuario.' });
    }
  },

  changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Se requiere contraseña actual y nueva contraseña.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
      const user = db.queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'La contraseña actual no es correcta.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword, salt);

      db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id]);

      res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, message: 'Error al cambiar contraseña.' });
    }
  }
};

module.exports = authController;
