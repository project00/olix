// utils/logger.js
const winston = require('winston');
const { Log } = require('../models');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

exports.logToDb = async (level, message, userId) => {
  try {
    await Log.create({
      livello: level,
      messaggio: message,
      user_id: userId,
      timestamp: new Date()
    });
    logger.log(level, message);
  } catch (error) {
    console.error('Logging error:', error);
    logger.error('Failed to log to database:', error);
  }
};