// backend/utils/roles.js

/**
 * Definizione dei ruoli utente nel sistema
 */
const ROLES = {
  ADMIN: 1,
  OFFICINA: 2,
  CLIENTE: 3,
  STAFF: 4
};

/**
 * Definizione delle funzionalità del sistema, organizzate per categorie
 */
const FEATURES = {
  // Gestione utenti
  USER_MANAGEMENT: 'user:management',
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  
  // Gestione profili
  PROFILE_VIEW_OWN: 'profile:view:own',
  PROFILE_EDIT_OWN: 'profile:edit:own',
  PROFILE_VIEW_ALL: 'profile:view:all',
  
  // Gestione servizi
  SERVICE_VIEW: 'service:view',
  SERVICE_CREATE: 'service:create',
  SERVICE_EDIT: 'service:edit',
  SERVICE_DELETE: 'service:delete',
  
  // Gestione offerte
  OFFER_VIEW: 'offer:view',
  OFFER_CREATE: 'offer:create',
  OFFER_EDIT_OWN: 'offer:edit:own',
  OFFER_EDIT_ALL: 'offer:edit:all',
  OFFER_DELETE_OWN: 'offer:delete:own',
  OFFER_DELETE_ALL: 'offer:delete:all',
  
  // Gestione prenotazioni
  BOOKING_VIEW_OWN: 'booking:view:own',
  BOOKING_VIEW_ALL: 'booking:view:all',
  BOOKING_CREATE: 'booking:create',
  BOOKING_EDIT_OWN: 'booking:edit:own',
  BOOKING_EDIT_ALL: 'booking:edit:all',
  BOOKING_CANCEL_OWN: 'booking:cancel:own',
  BOOKING_CANCEL_ALL: 'booking:cancel:all',
  
  // Gestione veicoli
  VEHICLE_VIEW_OWN: 'vehicle:view:own',
  VEHICLE_VIEW_ALL: 'vehicle:view:all',
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_EDIT_OWN: 'vehicle:edit:own',
  VEHICLE_EDIT_ALL: 'vehicle:edit:all',
  VEHICLE_DELETE_OWN: 'vehicle:delete:own',
  VEHICLE_DELETE_ALL: 'vehicle:delete:all',
  
  // Gestione disponibilità
  AVAILABILITY_VIEW: 'availability:view',
  AVAILABILITY_EDIT: 'availability:edit'
};

/**
 * Mappa che associa a ciascun ruolo le funzionalità a cui ha accesso
 */
const ROLE_PERMISSIONS = {
  // Admin ha accesso a tutte le funzionalità
  [ROLES.ADMIN]: Object.values(FEATURES),
  
  // Officina ha accesso a gestione servizi, disponibilità, visualizzazione prenotazioni
  [ROLES.OFFICINA]: [
    FEATURES.PROFILE_VIEW_OWN,
    FEATURES.PROFILE_EDIT_OWN,
    FEATURES.SERVICE_VIEW,
    FEATURES.SERVICE_CREATE,
    FEATURES.SERVICE_EDIT,
    FEATURES.SERVICE_DELETE,
    FEATURES.OFFER_VIEW,
    FEATURES.OFFER_CREATE,
    FEATURES.OFFER_EDIT_OWN,
    FEATURES.OFFER_DELETE_OWN,
    FEATURES.BOOKING_VIEW_OWN,
    FEATURES.BOOKING_EDIT_OWN,
    FEATURES.AVAILABILITY_VIEW,
    FEATURES.AVAILABILITY_EDIT
  ],
  
  // Cliente ha accesso a prenotazioni, veicoli, visualizzazione servizi e offerte
  [ROLES.CLIENTE]: [
    FEATURES.PROFILE_VIEW_OWN,
    FEATURES.PROFILE_EDIT_OWN,
    FEATURES.SERVICE_VIEW,
    FEATURES.OFFER_VIEW,
    FEATURES.BOOKING_VIEW_OWN,
    FEATURES.BOOKING_CREATE,
    FEATURES.BOOKING_EDIT_OWN,
    FEATURES.BOOKING_CANCEL_OWN,
    FEATURES.VEHICLE_VIEW_OWN,
    FEATURES.VEHICLE_CREATE,
    FEATURES.VEHICLE_EDIT_OWN,
    FEATURES.VEHICLE_DELETE_OWN
  ],
  
  // Staff ha accesso limitato a visualizzazione
  [ROLES.STAFF]: [
    FEATURES.PROFILE_VIEW_OWN,
    FEATURES.PROFILE_EDIT_OWN,
    FEATURES.USER_VIEW,
    FEATURES.SERVICE_VIEW,
    FEATURES.OFFER_VIEW,
    FEATURES.BOOKING_VIEW_ALL
  ]
};

/**
 * Verifica se un ruolo ha un determinato permesso
 * @param {number} roleId - ID del ruolo
 * @param {string} feature - Funzionalità da verificare
 * @returns {boolean} - True se il ruolo ha il permesso, false altrimenti
 */
const hasPermission = (roleId, feature) => {
  // Se il ruolo non esiste, non ha permessi
  if (!ROLE_PERMISSIONS[roleId]) return false;
  
  // Verifica se il ruolo ha il permesso specifico
  return ROLE_PERMISSIONS[roleId].includes(feature);
};

/**
 * Ottiene tutti i permessi associati a un ruolo
 * @param {number} roleId - ID del ruolo
 * @returns {Array<string>} - Array di permessi
 */
const getPermissions = (roleId) => {
  return ROLE_PERMISSIONS[roleId] || [];
};

/**
 * Verifica se un utente ha accesso a una funzionalità
 * @param {Object} user - Oggetto utente
 * @param {string} feature - Funzionalità da verificare
 * @returns {boolean} - True se l'utente ha accesso, false altrimenti
 */
const canAccess = (user, feature) => {
  if (!user || !user.role) return false;
  return hasPermission(user.role, feature);
};

/**
 * Ottiene tutti i ruoli che hanno accesso a una funzionalità
 * @param {string} feature - Funzionalità da verificare
 * @returns {Array<number>} - Array di ID ruoli
 */
const getRolesWithAccess = (feature) => {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([_, permissions]) => permissions.includes(feature))
    .map(([roleId]) => Number(roleId));
};

module.exports = {
  ROLES,
  FEATURES,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissions,
  canAccess,
  getRolesWithAccess
};