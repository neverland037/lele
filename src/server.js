const app = require('./app');
const env = require('./config/env');
const { initDatabase } = require('./database/init');

// Initialize Database & Seeds
try {
  initDatabase();
} catch (err) {
  console.error('Failed to initialize database:', err);
}

// Start Server
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor iniciado exitosamente en el puerto ${env.PORT}`);
  console.log(`🌐 Web Pública: http://localhost:${env.PORT}`);
  console.log(`🔒 Panel Admin: http://localhost:${env.PORT}/admin`);
  console.log(`🔑 Login Admin: http://localhost:${env.PORT}/admin/login.html`);
  console.log(`💾 Base de Datos: ${env.DB_PATH}`);
  console.log(`====================================================`);
});

module.exports = server;
