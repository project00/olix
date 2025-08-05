// controllers/profileController.js
const { Anagrafica, User } = require('../models');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Cerca l'anagrafica dell'utente
        const profile = await Anagrafica.findOne({
            where: { usrlogin: userId }
        });
        
        if (!profile) {
            return res.status(404).json({ exists: false, message: 'Profilo non trovato' });
        }
        
        res.status(200).json({ exists: true, profile });
    } catch (error) {
        console.error('Errore nel recupero del profilo:', error);
        res.status(500).json({ error: 'Errore nel recupero del profilo' });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Verifica se esiste già un profilo
        const existingProfile = await Anagrafica.findOne({
            where: { usrlogin: userId }
        });
        
        if (existingProfile) {
            return res.status(400).json({ error: 'Profilo già esistente per questo utente' });
        }
        
        // Recupera i dati dal body della richiesta
        const {
            ragione_sociale,
            cognome,
            nome,
            indirizzo,
            citta,
            provincia,
            cap,
            latitudine,
            longitudine,
            piva,
            codice_fiscale,
            sdi
        } = req.body;
        
        // Crea il nuovo profilo
        const newProfile = await Anagrafica.create({
            ragione_sociale,
            cognome,
            nome,
            indirizzo,
            citta,
            provincia,
            cap,
            latitudine,
            longitudine,
            piva,
            codice_fiscale,
            sdi,
            consenso_privacy: true,
            data_consenso: new Date(),
            usrlogin: userId
        });
        
        res.status(201).json(newProfile);
    } catch (error) {
        console.error('Errore nella creazione del profilo:', error);
        res.status(500).json({ error: 'Errore nella creazione del profilo' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Trova il profilo esistente
        const profile = await Anagrafica.findOne({
            where: { usrlogin: userId }
        });
        
        if (!profile) {
            return res.status(404).json({ error: 'Profilo non trovato' });
        }
        
        // Aggiorna il profilo con i nuovi dati
        await profile.update(req.body);
        
        res.status(200).json(profile);
    } catch (error) {
        console.error('Errore nell\'aggiornamento del profilo:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
    }
};