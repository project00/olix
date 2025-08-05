// backend/tests/unit/roleCheck.test.js
const { roleCheck, hasFeature } = require('../../middlewares/roleCheck');
const { ROLES, FEATURES } = require('../../utils/roles');

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

  test('hasFeature dovrebbe consentire l\'accesso a utenti con il permesso richiesto', () => {
    const req = { user: { role: ROLES.ADMIN } };
    const res = {};
    const next = jest.fn();
    
    hasFeature(FEATURES.USER_MANAGEMENT)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('hasFeature dovrebbe negare l\'accesso a utenti senza il permesso richiesto', () => {
    const req = { user: { role: ROLES.CLIENTE } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    hasFeature(FEATURES.USER_MANAGEMENT)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});