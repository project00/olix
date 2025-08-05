// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth'); // Usa la destrutturazione per ottenere authMiddleware
const roleCheck = require('../middlewares/roleCheck');

// Usa authMiddleware invece di auth
const checkAdminRole = roleCheck([roleCheck.roles.ADMIN]);

// Ottieni tutti gli utenti (solo admin)
router.get('/', authMiddleware, checkAdminRole, userController.getAllUsers);

// Ottieni un utente specifico (solo admin)
router.get('/:id', authMiddleware, checkAdminRole, userController.getUserById);

// Aggiorna il ruolo di un utente (solo admin)
router.put('/:id/role', authMiddleware, checkAdminRole, userController.updateUserRole);

// Attiva/disattiva un utente (solo admin)
router.put('/:id/status', authMiddleware, checkAdminRole, userController.toggleUserStatus);

module.exports = router;