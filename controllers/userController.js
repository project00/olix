// controllers/userController.js
const { User, Anagrafica } = require('../models');

// Ottieni tutti gli utenti
// Ottieni tutti gli utenti
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'user', 'role', 'registration', 'active'],
            include: [
                {
                    model: Anagrafica,
                    as: 'Anagrafica', // Usa l'alias esatto come definito nell'associazione
                    attributes: ['nome', 'cognome', 'ragione_sociale']
                }
            ]
        });
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Errore nel recupero degli utenti:', error);
        res.status(500).json({ error: 'Errore nel recupero degli utenti' });
    }
};

// Ottieni un singolo utente per ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findByPk(userId, {
            attributes: ['id', 'user', 'role', 'registration', 'active'],
            include: [
                {
                    model: Anagrafica,
                    as: 'anagrafica',
                    attributes: ['nome', 'cognome', 'ragione_sociale']
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Errore nel recupero dell\'utente:', error);
        res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
    }
};

// Aggiorna il ruolo di un utente
exports.updateUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        // Verifica se il ruolo è valido (1-4)
        if (role < 1 || role > 4) {
            return res.status(400).json({ error: 'Ruolo non valido' });
        }
        
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        // Aggiorna il ruolo dell'utente
        await user.update({ role });
        
        res.status(200).json({ 
            id: user.id, 
            user: user.user, 
            role: user.role 
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento del ruolo:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento del ruolo' });
    }
};

// Attiva/disattiva un utente
exports.toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { active } = req.body;
        
        // Verifica se lo stato è valido (0 o 1)
        if (active !== 0 && active !== 1) {
            return res.status(400).json({ error: 'Stato non valido' });
        }
        
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        // Aggiorna lo stato dell'utente
        await user.update({ active });
        
        res.status(200).json({ 
            id: user.id, 
            user: user.user, 
            active: user.active 
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento dello stato:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato' });
    }
};