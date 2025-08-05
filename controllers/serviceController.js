// controllers/serviceController.js
const { Servizio, Anagrafica, User } = require('../models');
const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

const ServizioModel = sequelize.define('Servizio', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    descrizione: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    durata: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    attivo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Servizi'  // Specifica il nome esatto della tabella
});

exports.createService = async (req, res) => {
    try {
        // Verifica che l'utente sia un'officina
        const userId = req.user.userId;
        const user = await User.findByPk(userId);

        if (user.role !== 2) {
            return res.status(403).json({ error: 'Solo le officine possono creare servizi' });
        }

        // Verifica che l'officina esista
        const officina = await Anagrafica.findOne({ where: { usrlogin: userId } });
        if (!officina) {
            return res.status(404).json({ error: 'Profilo officina non trovato' });
        }

        // Crea il servizio
        const servizio = await ServizioModel.create({
            nome: req.body.nome,
            descrizione: req.body.descrizione,
            durata: req.body.durata,
            attivo: true
        });

        res.status(201).json(servizio);
    } catch (error) {
        console.error('Errore nella creazione del servizio:', error);
        res.status(500).json({ error: 'Errore nella creazione del servizio' });
    }
};

exports.getServices = async (req, res) => {
    try {
        // Verifica che l'utente sia un'officina
        const userId = req.user.userId;
        const user = await User.findByPk(userId);

        if (user.role !== 2) {
            console.log("Accesso negato: ruolo utente non valido");
            return res.status(403).json({ error: 'Solo le officine possono vedere i propri servizi' });
        }

        console.log("\n=== DEBUG QUERY SQL ===");
        console.log('Query SQL equivalente: SELECT * FROM "Servizi" ORDER BY "createdAt" DESC');

        // Prova prima con una query raw
        const [rawResults] = await sequelize.query('SELECT * FROM "Servizi" ORDER BY "createdAt" DESC');
        console.log("\n=== RISULTATI RAW QUERY ===");
        console.log("Numero di servizi trovati (raw):", rawResults.length);
        console.log("Raw data:", JSON.stringify(rawResults, null, 2));

        // Poi con findAll
        const servizi = await ServizioModel.findAll({
            order: [['createdAt', 'DESC']]
        });

        console.log("\n=== RISULTATI FINDALL ===");
        console.log("Numero di servizi trovati (findAll):", servizi.length);

        if (servizi.length > 0) {
            servizi.forEach(servizio => {
                console.log('-------------------');
                console.log('ID:', servizio.id);
                console.log('Nome:', servizio.nome);
                console.log('Descrizione:', servizio.descrizione);
                console.log('Data creazione:', servizio.createdAt);
            });
            res.json(servizi);
        } else {
            console.log('Nessun servizio trovato nella tabella "Servizi"');
            res.status(404).json({ message: 'Nessun servizio trovato per questa officina' });
        }

    } catch (error) {
        console.error('\n=== ERRORE ===');
        console.error('Tipo di errore:', error.name);
        console.error('Messaggio:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Errore nel recupero dei servizi' });
    }
};

exports.updateService = async (req, res) => {
    try {
        // Verifica che l'utente sia un'officina
        const userId = req.user.userId;
        const user = await User.findByPk(userId);

        if (user.role !== 2) {
            return res.status(403).json({ error: 'Solo le officine possono modificare i servizi' });
        }

        const serviceId = req.params.id;
        const servizio = await ServizioModel.findByPk(serviceId);

        if (!servizio) {
            return res.status(404).json({ error: 'Servizio non trovato' });
        }

        // Aggiorna il servizio
        await servizio.update({
            nome: req.body.nome || servizio.nome,
            descrizione: req.body.descrizione || servizio.descrizione,
            durata: req.body.durata || servizio.durata,
            attivo: req.body.attivo !== undefined ? req.body.attivo : servizio.attivo
        });

        res.json(servizio);
    } catch (error) {
        console.error('Errore nell\'aggiornamento del servizio:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento del servizio' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        // Verifica che l'utente sia un'officina
        const userId = req.user.userId;
        const user = await User.findByPk(userId);

        if (user.role !== 2) {
            return res.status(403).json({ error: 'Solo le officine possono eliminare i servizi' });
        }

        const serviceId = req.params.id;
        const servizio = await ServizioModel.findByPk(serviceId);

        if (!servizio) {
            return res.status(404).json({ error: 'Servizio non trovato' });
        }

        // Disattiva il servizio invece di eliminarlo
        await servizio.update({ attivo: false });

        res.json({ message: 'Servizio disattivato con successo' });
    } catch (error) {
        console.error('Errore nella disattivazione del servizio:', error);
        res.status(500).json({ error: 'Errore nella disattivazione del servizio' });
    }
};
