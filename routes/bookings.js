// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const { checkSchema } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const { 
  createBooking, 
  getAvailability, 
  getUserBookings, 
  updateBookingStatus,
  setAvailability,
  getWeeklyAvailability
} = require('../controllers/bookingController');
const { bookingValidation } = require('../middlewares/validation');

// Schema validazione prenotazione
const bookingSchema = checkSchema({
  offertaId: {
    in: ['body'],
    isInt: true,
    toInt: true,
    errorMessage: 'ID offerta non valido'
  },
  data: {
    in: ['body'],
    isISO8601: true,
    errorMessage: 'Formato data non valido (YYYY-MM-DD)'
  },
  ora: {
    in: ['body'],
    matches: {
      options: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
      errorMessage: 'Formato ora non valido (HH:MM)'
    }
  },
  cliente: {
    in: ['body'],
    isObject: true,
    errorMessage: 'Dati cliente mancanti'
  },
  'cliente.nome': {
    in: ['body'],
    notEmpty: true,
    errorMessage: 'Nome cliente obbligatorio'
  },
  'cliente.cognome': {
    in: ['body'],
    notEmpty: true,
    errorMessage: 'Cognome cliente obbligatorio'
  },
  'cliente.email': {
    in: ['body'],
    isEmail: true,
    errorMessage: 'Email non valida'
  },
  'cliente.cellulare': {
    in: ['body'],
    isMobilePhone: true,
    errorMessage: 'Numero cellulare non valido'
  }
});

// Route pubbliche
router.get('/availability/check', getAvailability);

// Route protette
router.use(authMiddleware);

router.post('/', bookingSchema, createBooking);
router.get('/user', getUserBookings); // Ottieni prenotazioni utente
router.get('/shop', roleCheck([2]), getUserBookings); // Ottieni prenotazioni officina

// Route di gestione disponibilità per officine
router.get('/availability/:offerId', 
  roleCheck([2]), // 2=Officina
  getWeeklyAvailability
);

router.post('/availability/:offerId', 
  roleCheck([2]), // 2=Officina
  checkSchema({
    offerId: {
      in: ['params'],
      isInt: true,
      toInt: true,
      errorMessage: 'ID offerta non valido'
    },
    availability: {
      in: ['body'],
      isArray: true,
      errorMessage: 'Formato disponibilità non valido'
    },
    'availability.*.giorno_settimana': {
      in: ['body'],
      isInt: {
        options: { min: 1, max: 6 }
      },
      errorMessage: 'Giorno della settimana non valido (1-6)'
    },
    'availability.*.ora_inizio': {
      in: ['body'],
      isFloat: {
        options: { min: 0, max: 23.5 }
      },
      errorMessage: 'Ora di inizio non valida'
    },
    'availability.*.ora_fine': {
      in: ['body'],
      isFloat: {
        options: { min: 0.5, max: 24 }
      },
      errorMessage: 'Ora di fine non valida'
    },
    'availability.*.intervallo_minuti': {
      in: ['body'],
      isInt: {
        options: { min: 15, max: 240 }
      },
      errorMessage: 'Intervallo minuti non valido (15-240)'
    },
    'availability.*.max_prenotazioni': {
      in: ['body'],
      isInt: {
        options: { min: 1 }
      },
      errorMessage: 'Numero massimo prenotazioni non valido'
    },
    'availability.*.attivo': {
      in: ['body'],
      isBoolean: true,
      errorMessage: 'Stato attivo non valido'
    }
  }),
  setAvailability
);

// Route admin/officina
router.put('/:id/status',
  roleCheck([1, 2]), // 1=Admin, 2=Officina
  checkSchema({
    id: {
      in: ['params'],
      isInt: true,
      toInt: true,
      errorMessage: 'ID prenotazione non valido'
    },
    stato: {
      in: ['body'],
      isIn: {
        options: [[0, 1, 2, 3]], // Stati consentiti
        errorMessage: 'Stato non valido'
      }
    }
  }),
  updateBookingStatus
);

module.exports = router;
