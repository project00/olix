// backend/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectOptions: process.env.DB_SSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: false
});

module.exports = sequelize;

