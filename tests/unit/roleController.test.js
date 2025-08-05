// backend/tests/unit/roleController.test.js
const { getAllRoles, getRoleById, getAllPermissions, getRolePermissions, getRoleUsers, createRole } = require('../../controllers/roleController');
const { ROLES, FEATURES, getPermissionsByRole } = require('../../utils/roles');
const db = require('../../models');

// Mock del modello Ruoli, User e sequelize
jest.mock('../../models', () => ({
  Ruoli: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  User: {
    findAll: jest.fn()
  },
  sequelize: {
    transaction: jest.fn().mockReturnValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    })
  }
}));

describe('Role Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getAllRoles dovrebbe restituire tutti i ruoli', async () => {
    const mockRoles = [
      { id: 1, nome: 'Admin', livello: 1 },
      { id: 2, nome: 'Officina', livello: 2 }
    ];
    db.Ruoli.findAll.mockResolvedValue(mockRoles);

    await getAllRoles(req, res);

    expect(db.Ruoli.findAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockRoles);
  });

  test('getRoleById dovrebbe restituire un ruolo specifico', async () => {
    const mockRole = { id: 1, nome: 'Admin', livello: 1 };
    db.Ruoli.findByPk.mockResolvedValue(mockRole);
    req.params = { id: 1 };

    await getRoleById(req, res);

    expect(db.Ruoli.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockRole);
  });

  test('getAllPermissions dovrebbe restituire tutti i permessi', async () => {
    await getAllPermissions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      permissions: Object.values(FEATURES).map(feature => ({
        id: feature,
        name: feature
      }))
    });
  });

  test('getRolePermissions dovrebbe restituire i permessi di un ruolo', async () => {
    req.params = { id: 1 };
    const mockRole = { id: 1, nome: 'Admin', livello: 1 };
    db.Ruoli.findByPk.mockResolvedValue(mockRole);

    await getRolePermissions(req, res);

    expect(db.Ruoli.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      role: mockRole,
      permissions: getPermissionsByRole(1)
    });
  });

  test('getRoleUsers dovrebbe restituire gli utenti di un ruolo', async () => {
    req.params = { id: 1 };
    const mockUsers = [
      { id: 1, user: 'admin', email: 'admin@example.com', role: 1 },
      { id: 2, user: 'admin2', email: 'admin2@example.com', role: 1 }
    ];
    db.User.findAll.mockResolvedValue(mockUsers);

    await getRoleUsers(req, res);

    expect(db.User.findAll).toHaveBeenCalledWith({
      where: { role: 1 },
      include: [{ model: db.Anagrafica, as: 'Anagrafica' }]
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  test('createRole dovrebbe creare un nuovo ruolo', async () => {
    // Backup dei valori originali di ROLES e ROLE_PERMISSIONS
    const originalROLES = { ...ROLES };
    const originalROLE_PERMISSIONS = { ...ROLE_PERMISSIONS };
    
    // Prepara i dati di richiesta
    req.body = {
      name: 'NUOVO_RUOLO',
      permissions: [FEATURES.USER_VIEW, FEATURES.SERVICE_VIEW]
    };
    
    await createRole(req, res);
    
    // Verifica che la transazione sia stata avviata e confermata
    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(db.sequelize.transaction().commit).toHaveBeenCalled();
    
    // Verifica che la risposta sia corretta
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: expect.any(Number),
      name: 'NUOVO_RUOLO',
      permissions: [FEATURES.USER_VIEW, FEATURES.SERVICE_VIEW]
    });
    
    // Ripristina i valori originali
    Object.assign(ROLES, originalROLES);
    Object.assign(ROLE_PERMISSIONS, originalROLE_PERMISSIONS);
  });

  test('createRole dovrebbe gestire errori di validazione', async () => {
    // Richiesta senza nome
    req.body = {
      permissions: [FEATURES.USER_VIEW]
    };
    
    await createRole(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Il nome del ruolo è obbligatorio' });
    expect(db.sequelize.transaction().commit).not.toHaveBeenCalled();
  });
});