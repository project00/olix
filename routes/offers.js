// backend/routes/offers.js
const express = require('express');
const router = express.Router();
const {checkSchema} = require('express-validator');
const { authMiddleware } = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const { offerValidation} = require('../middlewares/validation');
const {
    createOffer,
    getNearbyOffers,
    getOfferteNearby,
    updateOffer,
    deleteOffer,
    getOfferDetails,
    getUserOffers
} = require('../controllers/offerController');


// Schema validazione offerta
const offerSchema = checkSchema({
    descrizione: {
        in: ['body'],
        notEmpty: true,
        trim: true,
        escape: true,
        errorMessage: 'Descrizione obbligatoria (max 500 caratteri)',
        isLength: {options: {max: 500}}
    },
    cilindrata: {
        in: ['body'],
        optional: true,
        isFloat: {
            options: {min: 0, max: 10000},
            errorMessage: 'Cilindrata deve essere tra 0 e 10000'
        }
    },
    max: {
        in: ['body'],
        isInt: {
            options: {min: 1, max: 20},
            errorMessage: 'Max prenotazioni deve essere tra 1 e 20'
        }
    },
    tipo_offerta: {
        in: ['body'],
        isIn: {
            options: [['Automatica', 'Manuale']],
            errorMessage: 'Tipo offerta non valido'
        }
    },
    stato: {
        in: ['body'],
        optional: true,
        isIn: {
            options: [[0, 1, 2]],
            errorMessage: 'Stato non valido (0=Attiva, 1=Disattivata, 2=Cancellata)'
        }
    },
    tags: {
        in: ['body'],
        optional: true,
        isArray: {
            options: {max: 10},
            errorMessage: 'Max 10 tags consentiti'
        }
    },
    officina: {
        in: ['body'],
        optional: true,
        isInt: true,
        errorMessage: 'ID officina non valido'
    }
});

// Schema validazione geolocalizzazione
const geoValidation = checkSchema({
    lat: {
        in: ['query'],
        optional: true, // reso opzionale
        isFloat: {
            options: {min: -90, max: 90},
            errorMessage: 'Latitudine non valida (-90 a 90)'
        }
    },
    lon: {
        in: ['query'],
        optional: true, // reso opzionale
        isFloat: {
            options: {min: -180, max: 180},
            errorMessage: 'Longitudine non valida (-180 a 180)'
        }
    },
    radius: {
        in: ['query'],
        optional: true, // reso opzionale
        isInt: {
            options: {min: 1, max: 100},
            errorMessage: 'Raggio deve essere tra 1 e 100 km'
        }
    }
});

// Route pubbliche
router.get('/nearby', geoValidation, getOfferteNearby);

// Route protette
router.use(authMiddleware);

// Ottieni le offerte dell'utente corrente
router.get('/user', roleCheck([1, 2]), getUserOffers);

// Dettagli offerta specifica (deve stare dopo /user per evitare conflitti)
router.get('/:id', getOfferDetails);

// Route admin/officina
router.post('/',
    roleCheck([1, 2]), // 1=Admin, 2=Officina
    offerSchema,
    createOffer
);

router.put('/:id',
    roleCheck([1, 2]),
    checkSchema({
        id: {
            in: ['params'],
            isInt: true,
            errorMessage: 'ID offerta non valido'
        }
    }),
    offerSchema,
    updateOffer
);

router.delete('/:id',
    roleCheck([1]),
    checkSchema({
        id: {
            in: ['params'],
            isInt: true,
            errorMessage: 'ID offerta non valido'
        }
    }),
    deleteOffer
);

// Esporta solo il router
module.exports = router;

// Se hai bisogno di esportare anche geoValidation, puoi farlo come proprietà di router
// router.geoValidation = geoValidation;
