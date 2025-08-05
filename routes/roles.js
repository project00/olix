// backend/routes/roles.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware } = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const { FEATURES } = require('../utils/roles');

// Middleware per verificare che l'utente abbia i permessi di gestione utenti
const checkUserManagement = roleCheck.hasFeature(FEATURES.USER_MANAGEMENT);

// Ottieni tutti i ruoli (richiede autenticazione e permesso di gestione utenti)
router.get('/', authMiddleware, checkUserManagement, roleController.getAllRoles);

// Ottieni un ruolo specifico con i suoi permessi
router.get('/:id', authMiddleware, checkUserManagement, roleController.getRoleById);

// Ottieni tutti i permessi disponibili
router.get('/permissions/all', authMiddleware, checkUserManagement, roleController.getAllPermissions);

// Ottieni i permessi associati a un ruolo specifico
router.get('/:id/permissions', authMiddleware, checkUserManagement, roleController.getRolePermissions);

// Ottieni gli utenti associati a un ruolo specifico
router.get('/:id/users', authMiddleware, checkUserManagement, roleController.getUsersByRole);

// Crea un nuovo ruolo (richiede autenticazione e permesso di gestione utenti)
router.post('/', authMiddleware, checkUserManagement, roleController.createRole);

module.exports = router;