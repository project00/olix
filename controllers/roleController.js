// backend/controllers/roleController.js
const { ROLES, FEATURES, ROLE_PERMISSIONS, getPermissions } = require('../utils/roles');
const { User, sequelize } = require('../models');

/**
 * Ottiene tutti i ruoli disponibili nel sistema
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.getAllRoles = async (req, res) => {
  try {
    // Trasforma l'oggetto ROLES in un array di oggetti con id e nome
    const roles = Object.entries(ROLES).map(([name, id]) => ({
      id,
      name
    }));
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Errore nel recupero dei ruoli:', error);
    res.status(500).json({ error: 'Errore nel recupero dei ruoli' });
  }
};

/**
 * Ottiene un ruolo specifico con i suoi permessi
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.getRoleById = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Verifica se il ruolo esiste
    const roleName = Object.keys(ROLES).find(key => ROLES[key] === roleId);
    
    if (!roleName) {
      return res.status(404).json({ error: 'Ruolo non trovato' });
    }
    
    // Ottieni i permessi associati al ruolo
    const permissions = getPermissions(roleId);
    
    res.status(200).json({
      id: roleId,
      name: roleName,
      permissions
    });
  } catch (error) {
    console.error('Errore nel recupero del ruolo:', error);
    res.status(500).json({ error: 'Errore nel recupero del ruolo' });
  }
};

/**
 * Ottiene tutti i permessi disponibili nel sistema
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.getAllPermissions = async (req, res) => {
  try {
    // Trasforma l'oggetto FEATURES in un array di oggetti con codice e descrizione
    const permissions = Object.entries(FEATURES).map(([key, code]) => {
      // Trasforma il codice in una descrizione leggibile
      // Esempio: 'user:management' -> 'Gestione utenti'
      const parts = code.split(':');
      let description = '';
      
      switch (parts[0]) {
        case 'user':
          description = 'Utenti';
          break;
        case 'profile':
          description = 'Profili';
          break;
        case 'service':
          description = 'Servizi';
          break;
        case 'offer':
          description = 'Offerte';
          break;
        case 'booking':
          description = 'Prenotazioni';
          break;
        case 'vehicle':
          description = 'Veicoli';
          break;
        case 'availability':
          description = 'Disponibilità';
          break;
        default:
          description = parts[0];
      }
      
      // Aggiungi il tipo di operazione
      if (parts[1]) {
        switch (parts[1]) {
          case 'management':
            description += ' - Gestione completa';
            break;
          case 'view':
            description += ' - Visualizzazione';
            break;
          case 'edit':
            description += ' - Modifica';
            break;
          case 'create':
            description += ' - Creazione';
            break;
          case 'delete':
            description += ' - Eliminazione';
            break;
          default:
            description += ` - ${parts[1]}`;
        }
      }
      
      // Aggiungi il contesto (own/all)
      if (parts[2]) {
        switch (parts[2]) {
          case 'own':
            description += ' (propri)';
            break;
          case 'all':
            description += ' (tutti)';
            break;
          default:
            description += ` (${parts[2]})`;
        }
      }
      
      return {
        code,
        key,
        description
      };
    });
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Errore nel recupero dei permessi:', error);
    res.status(500).json({ error: 'Errore nel recupero dei permessi' });
  }
};

/**
 * Ottiene i permessi associati a un ruolo specifico
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.getRolePermissions = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Verifica se il ruolo esiste
    const roleName = Object.keys(ROLES).find(key => ROLES[key] === roleId);
    
    if (!roleName) {
      return res.status(404).json({ error: 'Ruolo non trovato' });
    }
    
    // Ottieni i permessi associati al ruolo
    const permissions = getPermissions(roleId);
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Errore nel recupero dei permessi del ruolo:', error);
    res.status(500).json({ error: 'Errore nel recupero dei permessi del ruolo' });
  }
};

/**
 * Ottiene gli utenti associati a un ruolo specifico
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.getUsersByRole = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Verifica se il ruolo esiste
    const roleName = Object.keys(ROLES).find(key => ROLES[key] === roleId);
    
    if (!roleName) {
      return res.status(404).json({ error: 'Ruolo non trovato' });
    }
    
    // Trova tutti gli utenti con il ruolo specificato
    const users = await User.findAll({
      where: { role: roleId },
      attributes: ['id', 'user', 'registration', 'active']
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Errore nel recupero degli utenti per ruolo:', error);
    res.status(500).json({ error: 'Errore nel recupero degli utenti per ruolo' });
  }
};

/**
 * Crea un nuovo ruolo nel sistema
 * @param {Object} req - Richiesta Express
 * @param {Object} res - Risposta Express
 */
exports.createRole = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { name, permissions = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Il nome del ruolo è obbligatorio' });
    }
    
    // Verifica che il nome del ruolo non esista già
    const existingRoleId = ROLES[name.toUpperCase()];
    if (existingRoleId) {
      return res.status(400).json({ error: 'Un ruolo con questo nome esiste già' });
    }
    
    // Trova il massimo ID di ruolo esistente e incrementa di 1
    const maxRoleId = Math.max(...Object.values(ROLES));
    const newRoleId = maxRoleId + 1;
    
    // Aggiorna l'oggetto ROLES con il nuovo ruolo
    ROLES[name.toUpperCase()] = newRoleId;
    
    // Aggiorna l'oggetto ROLE_PERMISSIONS con i permessi del nuovo ruolo
    ROLE_PERMISSIONS[newRoleId] = permissions;
    
    // Restituisci il nuovo ruolo creato
    const newRole = {
      id: newRoleId,
      name: name.toUpperCase(),
      permissions
    };
    
    await t.commit();
    res.status(201).json(newRole);
  } catch (error) {
    await t.rollback();
    console.error('Errore nella creazione del ruolo:', error);
    res.status(500).json({ error: 'Errore nella creazione del ruolo' });
  }
};