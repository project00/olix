const { sequelize, Prenotazione, Calendario } = require('../models');

const createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { offertaId, data, ora, cliente } = req.body;

    // Verifica disponibilità
    const slot = await Calendario.findOne({
      where: { 
        id_offerta: offertaId,
        giorno_settimana: new Date(data).getDay() || 7,
        ora_inizio: ora,
        attivo: true
      },
      transaction
    });

    if (!slot) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Slot non disponibile' });
    }

    const prenotazioniEsistenti = await Prenotazione.count({
      where: { 
        data: new Date(data), 
        ora 
      },
      transaction
    });

    if (prenotazioniEsistenti >= slot.max_prenotazioni) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Slot completo' });
    }

    // Crea prenotazione
    const nuovaPrenotazione = await Prenotazione.create({
      officina: slot.officina,
      data: new Date(data),
      offerta: offertaId,
      ora,
      stato: 1,
      userId: req.user.userId
    }, { transaction });

    // Salva dati cliente
    await PrenotazioneDatiCliente.create({
      id_prenotazione: nuovaPrenotazione.id,
      ...cliente
    }, { transaction });

    await transaction.commit();
    res.status(201).json(nuovaPrenotazione);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { offertaId, startDate, endDate } = req.query;
    
    if (!offertaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID offerta richiesto' 
      });
    }
    
    // Validazione date
    const start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();
    
    // Se endDate non è fornito, imposta a 30 giorni dal start
    if (!endDate) {
      end.setDate(start.getDate() + 30);
    }
    
    // Ottieni informazioni di disponibilità dal database
    const slots = await Calendario.findAll({
      where: {
        id_offerta: offertaId,
        attivo: true
      },
      order: [
        ['ora_inizio', 'ASC']
      ]
    });
    
    // Ottieni le prenotazioni esistenti per questo periodo e offerta
    const prenotazioni = await Prenotazione.findAll({
      where: {
        offerta: offertaId,
        data: {
          [sequelize.Op.between]: [start, end]
        }
      }
    });
    
    // Mappa delle prenotazioni per data e ora per facile ricerca
    const prenotazioniMap = {};
    prenotazioni.forEach(p => {
      const key = `${p.data.toISOString().split('T')[0]}-${p.ora}`;
      prenotazioniMap[key] = true;
    });
    
    // Mappa degli slot disponibili per giorno della settimana e ora
    const slotMap = {};
    slots.forEach(slot => {
      const dayKey = slot.giorno_settimana.toString();
      if (!slotMap[dayKey]) {
        slotMap[dayKey] = {};
      }
      slotMap[dayKey][slot.ora_inizio] = slot.attivo;
    });
    
    // Genera calendario per il periodo richiesto
    const availability = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay() || 7; // 0 = domenica, 1-6 = lunedì-sabato
      
      // Domenica non disponibile (dayOfWeek = 0)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const daySlots = [];
        
        // Genera slot orari dalle 8 alle 19 (ultimo slot alle 18)
        for (let hour = 8; hour <= 18; hour++) {
          const timeKey = `${dateStr}-${hour}`;
          const isBooked = prenotazioniMap[timeKey] || false;
          
          // Controlla se l'officina ha questo slot disponibile nel suo calendario
          const isAvailable = slotMap[dayOfWeek.toString()]?.[hour] !== false;
          
          daySlots.push({
            hour,
            available: isAvailable && !isBooked
          });
        }
        
        availability.push({
          date: dateStr,
          dayOfWeek,
          slots: daySlots
        });
      }
      
      // Avanza al giorno successivo
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({ 
      success: true, 
      availability,
      workingHours: {
        start: 8,
        end: 19,
        interval: 60 // minuti
      }
    });
    
  } catch (error) {
    console.error('Errore in getAvailability:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId; // Supponiamo che l'ID dell'utente sia in `req.user`

    // Recupera le prenotazioni dell'utente
    const bookings = await Prenotazione.findAll({
      where: { userId },
      order: [['data', 'ASC']], // Ordina per data crescente
    });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Errore in getUserBookings:', error);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body; // Otteniamo l'ID della prenotazione e il nuovo stato

    // Controlliamo se la prenotazione esiste
    const booking = await Prenotazione.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Prenotazione non trovata' });
    }

    // Aggiorniamo lo stato della prenotazione
    booking.stato = status;
    await booking.save();

    res.status(200).json({ success: true, message: 'Stato aggiornato', booking });
  } catch (error) {
    console.error('Errore in updateBookingStatus:', error);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};
// Imposta la disponibilità di slot orari per un'offerta
const setAvailability = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { offerId } = req.params;
    const { availability } = req.body;
    
    if (!offerId || !availability || !Array.isArray(availability)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Dati di disponibilità non validi' 
      });
    }
    
    // Verifica che l'offerta appartenga all'utente corrente
    const userId = req.user.userId;
    const anagrafica = await sequelize.models.Anagrafica.findOne({
      where: { usrlogin: userId }
    }, { transaction });
    
    if (!anagrafica) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Profilo anagrafica non trovato' });
    }
    
    const offerta = await sequelize.models.Offerta.findOne({
      where: { 
        id: offerId,
        officina: anagrafica.id
      }
    }, { transaction });
    
    if (!offerta) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'Non hai il permesso di modificare questa offerta' 
      });
    }
    
    // Elimina le configurazioni di slot esistenti
    await Calendario.destroy({
      where: { id_offerta: offerId }
    }, { transaction });
    
    // Crea nuovi slot
    const calendarioEntries = availability.map(slot => ({
      id_offerta: offerId,
      giorno_settimana: slot.giorno_settimana,
      ora_inizio: slot.ora_inizio,
      ora_fine: slot.ora_fine || slot.ora_inizio + 1,
      intervallo_minuti: slot.intervallo_minuti || 60,
      max_prenotazioni: slot.max_prenotazioni || 1,
      attivo: true,
      eccezioni: slot.eccezioni || null
    }));
    
    await Calendario.bulkCreate(calendarioEntries, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({ 
      success: true, 
      message: 'Disponibilità aggiornata con successo' 
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Errore in setAvailability:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
};

// Ottiene lo schema di disponibilità settimanale per un'officina
const getWeeklyAvailability = async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const slots = await Calendario.findAll({
            where: {
                id_offerta: offerId,
                attivo: true
            },
            attributes: [
                'id',
                'id_offerta',
                'giorno_settimana',
                'ora_inizio',
                'ora_fine',
                'intervallo_minuti',
                'max_prenotazioni',
                'eccezioni'
            ],
            order: [
                ['giorno_settimana', 'ASC'],
                ['ora_inizio', 'ASC']
            ]
        });

        // Organizziamo gli slot per giorno della settimana
        const weeklyAvailability = {};
        for (let i = 1; i <= 7; i++) {
            weeklyAvailability[i] = [];
        }

        slots.forEach(slot => {
            weeklyAvailability[slot.giorno_settimana].push({
                id: slot.id,
                inizio: slot.ora_inizio,
                fine: slot.ora_fine,
                intervallo: slot.intervallo_minuti,
                maxPrenotazioni: slot.max_prenotazioni,
                eccezioni: slot.eccezioni
            });
        });

        res.json(weeklyAvailability);
    } catch (error) {
        console.error('Errore in getWeeklyAvailability:', error);
        res.status(500).json({ error: 'Errore nel recupero della disponibilità' });
    }
};

// Esportare la funzione
module.exports = {
  createBooking,
  getAvailability,
  getUserBookings,  
  updateBookingStatus,
  setAvailability,
  getWeeklyAvailability
};
