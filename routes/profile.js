// routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/auth');

// Ottieni il profilo dell'utente
router.get('/', authMiddleware, profileController.getProfile);

// Crea un nuovo profilo
router.post('/', authMiddleware, profileController.createProfile);

// Aggiorna il profilo esistente
router.put('/', authMiddleware, profileController.updateProfile);

module.exports = router;