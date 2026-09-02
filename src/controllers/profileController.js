const db = require('../config/database');

const profileController = {
  getProfile(req, res) {
    try {
      const profile = db.queryOne('SELECT * FROM profile WHERE id = 1');
      const settings = db.queryOne('SELECT * FROM site_settings WHERE id = 1');
      res.json({
        success: true,
        profile: profile || {},
        settings: settings || {}
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ success: false, message: 'Error al obtener perfil.' });
    }
  },

  updateProfile(req, res) {
    const {
      name, tagline, bio_title, bio_content, avatar_url, resume_url,
      email, phone, whatsapp, instagram, facebook, linkedin, behance
    } = req.body;

    try {
      db.run(`
        UPDATE profile SET
          name = COALESCE(?, name),
          tagline = COALESCE(?, tagline),
          bio_title = COALESCE(?, bio_title),
          bio_content = COALESCE(?, bio_content),
          avatar_url = COALESCE(?, avatar_url),
          resume_url = COALESCE(?, resume_url),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          whatsapp = COALESCE(?, whatsapp),
          instagram = COALESCE(?, instagram),
          facebook = COALESCE(?, facebook),
          linkedin = COALESCE(?, linkedin),
          behance = COALESCE(?, behance),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [
        name, tagline, bio_title, bio_content, avatar_url, resume_url,
        email, phone, whatsapp, instagram, facebook, linkedin, behance
      ]);

      const updated = db.queryOne('SELECT * FROM profile WHERE id = 1');
      res.json({ success: true, message: 'Perfil actualizado correctamente.', profile: updated });
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar perfil.' });
    }
  },

  updateSettings(req, res) {
    const { site_title, meta_description, hero_title, hero_subtitle, footer_text } = req.body;

    try {
      db.run(`
        UPDATE site_settings SET
          site_title = COALESCE(?, site_title),
          meta_description = COALESCE(?, meta_description),
          hero_title = COALESCE(?, hero_title),
          hero_subtitle = COALESCE(?, hero_subtitle),
          footer_text = COALESCE(?, footer_text),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [site_title, meta_description, hero_title, hero_subtitle, footer_text]);

      const updated = db.queryOne('SELECT * FROM site_settings WHERE id = 1');
      res.json({ success: true, message: 'Configuración actualizada.', settings: updated });
    } catch (err) {
      console.error('Error updating settings:', err);
      res.status(500).json({ success: false, message: 'Error al actualizar configuración.' });
    }
  }
};

module.exports = profileController;
