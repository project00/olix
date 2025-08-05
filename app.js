// app.js
require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middlewares/auth');
const offerRoutes = require('./routes/offers');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const { logToDb } = require('./utils/logger');
const cors = require('cors');

const app = express();

// Configura CORS per permettere richieste dal frontend
app.use(cors({
  origin: 'http://localhost:5173', // Permette solo questo origin
  methods: 'GET,POST,PUT,DELETE',  // Specifica i metodi permessi
  credentials: true                // Permette l'invio di cookie e credenziali
}));

app.use(express.json());

// Connessione DB
sequelize.authenticate()
    .then(() => logToDb('info', 'DB Connected', null))
    .catch(err => logToDb('error', `DB Connection Error: ${err.message}`, null));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', authMiddleware, serviceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Error handling
app.use((err, req, res, next) => {
  logToDb('error', err.message, req.user?.userId);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  logToDb('info', `Server running on port ${PORT}`, null);
  console.log(`Server running on port ${PORT}`);
});
