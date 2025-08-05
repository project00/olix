// backend/controllers/offerController.js
const { validationResult } = require('express-validator');
const { Offerta, Anagrafica, Servizio, Calendario} = require('../models');
const sequelize = require('../config/db'); // Importa l'istanza di sequelize configurata
const { Op } = require('sequelize'); // Importa Op da sequelize

/**
 * Crea una nuova offerta
 */
const createOffer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Estrai i servizi dall'oggetto richiesta
    const { servizi, ...offerData } = req.body;
    
    // Verifica che i campi prezzo e marca siano presenti
    if (offerData.prezzo === undefined) {
      return res.status(400).json({ error: 'Il campo prezzo è obbligatorio' });
    }
    
    // Converte il prezzo in un tipo numerico
    offerData.prezzo = parseFloat(offerData.prezzo);
    if (isNaN(offerData.prezzo) || offerData.prezzo < 0) {
      return res.status(400).json({ error: 'Il prezzo deve essere un numero positivo' });
    }
    
    // Se l'utente non ha specificato un'officina, usa il suo profilo
    if (!offerData.officina) {
      // Ottieni l'ID utente dal token decodificato
      const userId = req.user.userId;
      console.log('Creazione offerta - User ID:', userId);
      const anagrafica = await Anagrafica.findOne({
        where: { usrlogin: userId }
      });
      
      if (!anagrafica) {
        return res.status(404).json({ error: 'Profilo anagrafica non trovato' });
      }
      
      offerData.officina = anagrafica.id;
    }
    
    // Crea l'offerta
    const newOffer = await Offerta.create(offerData);
    
    // Associa i servizi se presenti
    if (servizi && servizi.length > 0) {
      await newOffer.addServizi(servizi);
      
      // Ottieni l'offerta con i servizi associati
      const offerWithServices = await Offerta.findByPk(newOffer.id, {
        include: [
          {
            model: Servizio,
            as: 'servizi',
            through: { attributes: [] }
          }
        ]
      });
      
      return res.status(201).json(offerWithServices);
    }
    
    return res.status(201).json(newOffer);
  } catch (error) {
    console.error('Errore creazione offerta:', error);
    return res.status(500).json({ error: 'Errore interno del server nella creazione dell\'offerta' });
  }
};

/**
 * Crea una nuova offerta (alias della precedente)
 */
const createOfferta = async (req, res) => {
  try {
    const offerta = await Offerta.create(req.body);
    res.status(201).json(offerta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Ottiene i dettagli di un'offerta specifica
 */
const getOfferDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offerta = await Offerta.findByPk(id, {
      include: [
        {
          model: Anagrafica,
          as: 'officinaInfo',
          attributes: ['id', 'ragione_sociale', 'latitudine', 'longitudine']
        },
        {
          model: Servizio,
          as: 'servizi',
          through: { attributes: [] }
        },
        {
          model: Calendario,
          as: 'orari'
        }
      ]
    });

    if (!offerta) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    res.json(offerta);
  } catch (error) {
    console.error('Errore recupero dettagli offerta:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancella un'offerta
 */
const deleteOffer = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID offerta non valido o mancante' });
    }

    const offerId = parseInt(id, 10);

    const offer = await Offerta.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    await offer.destroy();
    return res.json({ message: 'Offerta eliminata con successo' });
  } catch (error) {
    console.error('Errore eliminazione offerta:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

/**
 * Aggiorna un'offerta esistente
 */
const updateOffer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const id = req.params.id;

    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID offerta non valido o mancante' });
    }

    const offerId = parseInt(id, 10);

    const offer = await Offerta.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    // Estrai i servizi dall'oggetto richiesta
    const { servizi, ...offerData } = req.body;
    
    // Gestisci il campo prezzo se presente
    if (offerData.prezzo !== undefined) {
      offerData.prezzo = parseFloat(offerData.prezzo);
      if (isNaN(offerData.prezzo) || offerData.prezzo < 0) {
        return res.status(400).json({ error: 'Il prezzo deve essere un numero positivo' });
      }
    }
    
    // Aggiorna i dati dell'offerta
    await offer.update(offerData);
    
    // Aggiorna le associazioni di servizio se presenti
    if (servizi) {
      // Rimuovi tutte le associazioni esistenti
      await offer.setServizi([]);
      
      // Aggiungi le nuove associazioni
      if (servizi.length > 0) {
        await offer.addServizi(servizi);
      }
      
      // Ottieni l'offerta aggiornata con i servizi associati
      const updatedOffer = await Offerta.findByPk(offerId, {
        include: [
          {
            model: Servizio,
            as: 'servizi',
            through: { attributes: [] }
          }
        ]
      });
      
      return res.json(updatedOffer);
    }
    
    return res.json(offer);
  } catch (error) {
    console.error('Errore aggiornamento offerta:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

/**
 * Ottiene offerte nelle vicinanze basate su latitudine, longitudine e raggio
 */
const getNearbyOffers = async (req, res) => {
  try {
    // Estrai i parametri dalla query
    let { lat, lon, radius } = req.query;

    // Se mancano, assegna dei valori di default
    lat = lat !== undefined ? parseFloat(lat) : 40.3531;    // esempio: latitudine di Lecce
    lon = lon !== undefined ? parseFloat(lon) : 18.1724;     // esempio: longitudine di Lecce
    radius = radius !== undefined ? parseInt(radius, 10) : 50; // raggio di default in km

    // Qui va la logica per ottenere le offerte vicine in base ai parametri.
    // Per esempio, potresti usare una query con funzioni geospaziali se il tuo DB le supporta.
    // Per ora, simuliamo una risposta:
    const offers = [
      {
        id: 1,
        name: "Offerta 3",
        lat: 45.4650,
        lon: 9.1895,
      },
      {
        id: 2,
        name: "Offerta 2",
        lat: 45.4645,
        lon: 9.1905,
      },
    ];

    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error("Errore in getNearbyOffers:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

/**
 * Ottiene offerte nelle vicinanze basate su latitudine, longitudine e raggio (implementazione alternativa)
 */
const getOfferteNearby = async (req, res) => {
  try {
    console.log('1. Parametri ricevuti:', req.query);
    const { lat, lon, radius } = req.query;

    if (!lat || !lon || !radius) {
      console.log('2. Parametri mancanti');
      return res.status(400).json({ error: 'Parametri lat, lon e radius sono richiesti' });
    }

    console.log('3. Costruzione query con parametri:', { lat, lon, radius });
    const offers = await Anagrafica.findAll({
      attributes: [
        'id',
        'ragione_sociale',
        'indirizzo',
        'latitudine',
        'longitudine',
        [
          sequelize.literal(`
            ST_Distance(
              ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)})::geography,
              ST_MakePoint("Anagrafica"."longitudine", "Anagrafica"."latitudine")::geography
            ) / 1000`),
          'distance'
        ]
      ],
      include: [{
        model: Offerta,
        where: { stato: 0 },
        required: true
      }],
      where: sequelize.literal(`
        ST_Distance(
          ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)})::geography,
          ST_MakePoint("Anagrafica"."longitudine", "Anagrafica"."latitudine")::geography
        ) / 1000 <= ${parseInt(radius)}
      `),
      order: [[sequelize.literal('distance'), 'ASC']]
    });

    console.log('4. Query eseguita, risultati:', offers.length);
    res.json(offers);
  } catch (err) {
    console.log('5. Errore:', err);
    console.log('Query SQL generata:', err.sql);  // Mostra la query SQL generata
    console.log('Parametri query:', err.parameters);  // Mostra i parametri
    res.status(500).json({ error: err.message });
  }
};

/**
 * Ottiene tutte le offerte attive
 */
const getAllOffers = async (req, res) => {
  try {
    const offers = await Offerta.findAll({
      where: {
        stato: {
          [Op.not]: 2, // Escludi offerte cancellate
        },
      },
      include: [
        {
          model: Servizio,
          as: 'servizi',
          through: {
            attributes: [], // Non include gli attributi della tabella di collegamento
          },
        },
        {
          model: Anagrafica,
          as: 'officinaInfo',
          attributes: ['id', 'ragione_sociale', 'latitudine', 'longitudine']
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json(offers);
  } catch (error) {
    console.error('Errore recupero offerte:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

/**
 * Ottiene offerte per una specifica officina
 */
const getOfficinaOffers = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID officina non valido o mancante' });
    }

    const officinaId = parseInt(id, 10);

    const offers = await Offerta.findAll({
      where: {
        officina: officinaId,
        stato: { [Op.not]: 2 } // Escludi offerte cancellate
      },
      order: [['createdAt', 'DESC']]
    });

    return res.json(offers);
  } catch (error) {
    console.error('Errore recupero offerte officina:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

/**
 * Ottiene offerte dell'utente corrente (officina)
 */
const getUserOffers = async (req, res) => {
  try {
    // Verifica se l'utente è disponibile nella richiesta
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Utente non autenticato o ID mancante' });
    }
    
    // Ottiene l'ID dell'utente dalla sessione
    const userId = req.user.userId;
    console.log('User ID:', userId);
    
    // Trova l'anagrafica associata all'utente
    const anagrafica = await Anagrafica.findOne({
      where: { usrlogin: userId }  // Utilizzando il nome corretto della foreign key
    });
    
    if (!anagrafica) {
      return res.status(404).json({ error: 'Profilo anagrafica non trovato' });
    }
    
    console.log('Anagrafica trovata:', anagrafica.id);
    
    // Trova le offerte associate all'anagrafica
    const offers = await Offerta.findAll({
      where: {
        officina: anagrafica.id,
        stato: { [Op.not]: 2 } // Escludi offerte cancellate
      },
      include: [
        {
          model: Servizio,
          as: 'servizi',
          through: { attributes: [] } // Non include gli attributi della tabella di collegamento
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.json(offers);
  } catch (error) {
    console.error('Errore recupero offerte utente:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

module.exports = {
  createOffer,
  createOfferta,
  getAllOffers,
  getOfficinaOffers,
  getUserOffers,
  getNearbyOffers,
  updateOffer,
  deleteOffer,
  getOfferteNearby,
  getOfferDetails
};
