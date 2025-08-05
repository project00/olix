// Crea un file migrate.js
const sequelize = require('./config/db');
const User = require('./models/User');
const Prenotazione = require('./models/Prenotazione');

async function migrate() {
  await sequelize.sync({ force: true });
  console.log('Database migrated!');
  process.exit(0);
}

migrate();