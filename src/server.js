require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}/api/v1`);
    });

    // Apagado ordenado (útil en producción / contenedores)
    const shutdown = (signal) => {
      console.log(`\n${signal} recibido. Cerrando servidor...`);
      server.close(() => {
        console.log('Servidor cerrado correctamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

start();
