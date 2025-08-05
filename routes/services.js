// routes/services.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authMiddleware } = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// Middleware per verificare che l'utente sia un'officina
const isOfficina = roleCheck([2]); // Ruolo officina è 2

// Ottieni tutti i servizi (pubblico, accessibile senza autenticazione)
router.get('/', serviceController.getServices);

// Crea un nuovo servizio (richiede autenticazione come officina)
router.post('/', authMiddleware, isOfficina, serviceController.createService);

// Aggiorna un servizio esistente (richiede autenticazione come officina)
router.put('/:id', authMiddleware, isOfficina, serviceController.updateService);

// Elimina (disattiva) un servizio (richiede autenticazione come officina)
router.delete('/:id', authMiddleware, isOfficina, serviceController.deleteService);

module.exports = router;