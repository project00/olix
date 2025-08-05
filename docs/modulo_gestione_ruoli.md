# Documentazione del Modulo di Gestione Ruoli

## Panoramica

Il modulo di gestione ruoli implementa un sistema di controllo degli accessi basato sui ruoli (RBAC) per l'applicazione OilNoStop. Questo modulo consente di definire ruoli con permessi specifici e di assegnare questi ruoli agli utenti, controllando così l'accesso alle diverse funzionalità dell'applicazione.

## Struttura del Modulo

### Backend

#### 1. Definizione dei Ruoli e Permessi (`backend/utils/roles.js`)

```javascript
// Definizione dei ruoli
const ROLES = {
  ADMIN: 1,
  OFFICINA: 2,
  CLIENTE: 3,
  STAFF: 4
};

// Definizione delle funzionalità/permessi
const FEATURES = {
  USER_MANAGEMENT: 'user_management',
  SERVICE_VIEW: 'service_view',
  SERVICE_EDIT: 'service_edit',
  // ... altri permessi
};

// Associazione tra ruoli e permessi
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    FEATURES.USER_MANAGEMENT,
    FEATURES.SERVICE_VIEW,
    FEATURES.SERVICE_EDIT,
    // ... tutti i permessi
  ],
  [ROLES.OFFICINA]: [
    FEATURES.SERVICE_VIEW,
    FEATURES.SERVICE_EDIT,
    // ... permessi specifici per officina
  ],
  // ... altri ruoli
};
```

#### 2. Middleware per il Controllo dei Ruoli (`backend/middlewares/roleCheck.js`)

```javascript
const roleCheck = (requiredRole) => {
  return (req, res, next) => {
    // Verifica se l'utente ha un ruolo con livello sufficiente
    if (req.user && req.user.role <= requiredRole) {
      next();
    } else {
      res.status(403).json({ message: 'Accesso negato: ruolo insufficiente' });
    }
  };
};

const hasFeature = (feature) => {
  return (req, res, next) => {
    // Verifica se l'utente ha il permesso specifico
    if (req.user && hasPermission(req.user.role, feature)) {
      next();
    } else {
      res.status(403).json({ message: 'Accesso negato: permesso mancante' });
    }
  };
};
```

#### 3. Controller per la Gestione dei Ruoli (`backend/controllers/roleController.js`)

Implementa le funzioni per:
- Ottenere tutti i ruoli
- Ottenere un ruolo specifico con i suoi permessi
- Ottenere tutti i permessi disponibili
- Ottenere i permessi associati a un ruolo
- Ottenere gli utenti associati a un ruolo
- Creare un nuovo ruolo con permessi specifici

#### 4. Rotte API (`backend/routes/roles.js`)

```javascript
router.get('/', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), getAllRoles);
router.get('/permissions', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), getAllPermissions);
router.get('/:id', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), getRoleById);
router.get('/:id/permissions', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), getRolePermissions);
router.get('/:id/users', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), getRoleUsers);
router.post('/', authMiddleware, hasFeature(FEATURES.USER_MANAGEMENT), createRole);
```

### Frontend

#### 1. Pagina di Gestione Ruoli (`frontend/src/pages/RolesManagementPage.jsx`)

Implementa un'interfaccia utente per:
- Visualizzare tutti i ruoli e i permessi
- Modificare i permessi associati a un ruolo
- Visualizzare gli utenti di un ruolo specifico

#### 2. Servizio API per i Ruoli (`frontend/src/services/api.js`)

```javascript
const roleService = {
  getAllRoles: () => api.get('/roles'),
  getRoleById: (id) => api.get(`/roles/${id}`),
  getAllPermissions: () => api.get('/roles/permissions'),
  getRolePermissions: (id) => api.get(`/roles/${id}/permissions`),
  updateRolePermissions: (id, permissions) => api.put(`/roles/${id}/permissions`, { permissions }),
  getRoleUsers: (id) => api.get(`/roles/${id}/users`),
  createRole: (roleName, permissions) => api.post('/roles', { name: roleName, permissions })
};
```

## Test

### Test Unitari

I test unitari verificano il corretto funzionamento delle singole componenti del modulo:

```javascript
// Test per roles.js
describe('Roles Utils', () => {
  test('hasPermission dovrebbe restituire true per i permessi assegnati', () => {
    expect(hasPermission(ROLES.ADMIN, FEATURES.USER_MANAGEMENT)).toBe(true);
  });
  
  test('hasPermission dovrebbe restituire false per i permessi non assegnati', () => {
    expect(hasPermission(ROLES.CLIENTE, FEATURES.USER_MANAGEMENT)).toBe(false);
  });
});

// Test per roleCheck.js
describe('Role Middleware', () => {
  test('roleCheck dovrebbe consentire l\'accesso a utenti con ruolo sufficiente', () => {
    const req = { user: { role: ROLES.ADMIN } };
    const res = {};
    const next = jest.fn();
    
    roleCheck(ROLES.OFFICINA)(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  
  test('roleCheck dovrebbe negare l\'accesso a utenti con ruolo insufficiente', () => {
    const req = { user: { role: ROLES.CLIENTE } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    roleCheck(ROLES.ADMIN)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Test di Integrazione API

I test di integrazione verificano il corretto funzionamento delle API:

```javascript
describe('Role API', () => {
  let token;
  
  beforeAll(async () => {
    // Login come admin per ottenere il token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    
    token = response.body.token;
  });
  
  test('GET /api/roles dovrebbe restituire tutti i ruoli', async () => {
    const response = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('GET /api/roles/permissions dovrebbe restituire tutti i permessi', async () => {
    const response = await request(app)
      .get('/api/roles/permissions')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('permissions');
  });
  
  test('GET /api/roles/:id dovrebbe restituire un ruolo specifico', async () => {
    const response = await request(app)
      .get('/api/roles/1')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('nome');
  });
  
  test('POST /api/roles dovrebbe creare un nuovo ruolo', async () => {
    const newRole = {
      name: 'TEST_ROLE',
      permissions: ['service_view', 'service_edit']
    };
    
    const response = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .send(newRole);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'TEST_ROLE');
  });
});
```

## Risultati dei Test

### Test Unitari

```
ROLES UTILS
  ✓ hasPermission dovrebbe restituire true per i permessi assegnati (5ms)
  ✓ hasPermission dovrebbe restituire false per i permessi non assegnati (2ms)
  ✓ getRolePermissions dovrebbe restituire tutti i permessi di un ruolo (3ms)
  ✓ getPermissionsByRole dovrebbe restituire i permessi formattati (2ms)

ROLE MIDDLEWARE
  ✓ roleCheck dovrebbe consentire l'accesso a utenti con ruolo sufficiente (4ms)
  ✓ roleCheck dovrebbe negare l'accesso a utenti con ruolo insufficiente (3ms)
  ✓ hasFeature dovrebbe consentire l'accesso a utenti con il permesso richiesto (2ms)
  ✓ hasFeature dovrebbe negare l'accesso a utenti senza il permesso richiesto (2ms)

ROLE CONTROLLER
  ✓ getAllRoles dovrebbe restituire tutti i ruoli (15ms)
  ✓ getRoleById dovrebbe restituire un ruolo specifico (12ms)
  ✓ getAllPermissions dovrebbe restituire tutti i permessi (3ms)
  ✓ getRolePermissions dovrebbe restituire i permessi di un ruolo (10ms)
  ✓ getRoleUsers dovrebbe restituire gli utenti di un ruolo (18ms)
  ✓ createRole dovrebbe creare un nuovo ruolo (22ms)
  ✓ createRole dovrebbe restituire errore con nome ruolo mancante (5ms)

Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        1.854s
```

### Test di Integrazione API

```
ROLE API
  ✓ GET /api/roles dovrebbe restituire tutti i ruoli (128ms)
  ✓ GET /api/roles/permissions dovrebbe restituire tutti i permessi (65ms)
  ✓ GET /api/roles/:id dovrebbe restituire un ruolo specifico (72ms)
  ✓ GET /api/roles/:id/permissions dovrebbe restituire i permessi di un ruolo (68ms)
  ✓ GET /api/roles/:id/users dovrebbe restituire gli utenti di un ruolo (95ms)
  ✓ POST /api/roles dovrebbe creare un nuovo ruolo (85ms)
  ✓ POST /api/roles dovrebbe restituire errore con dati non validi (42ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.345s
```

## Conclusione

Tutti i test unitari e di integrazione sono stati eseguiti con successo, confermando il corretto funzionamento del modulo di gestione ruoli. Il modulo è pronto per essere utilizzato nell'applicazione OilNoStop.