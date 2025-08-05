// backend/tests/unit/roles.test.js
const { ROLES, FEATURES, ROLE_PERMISSIONS, hasPermission, getRolePermissions, getPermissionsByRole } = require('../../utils/roles');

describe('Roles Utils', () => {
  test('hasPermission dovrebbe restituire true per i permessi assegnati', () => {
    expect(hasPermission(ROLES.ADMIN, FEATURES.USER_MANAGEMENT)).toBe(true);
  });
  
  test('hasPermission dovrebbe restituire false per i permessi non assegnati', () => {
    expect(hasPermission(ROLES.CLIENTE, FEATURES.USER_MANAGEMENT)).toBe(false);
  });

  test('getRolePermissions dovrebbe restituire tutti i permessi di un ruolo', () => {
    const adminPermissions = getRolePermissions(ROLES.ADMIN);
    expect(adminPermissions).toEqual(ROLE_PERMISSIONS[ROLES.ADMIN]);
  });

  test('getPermissionsByRole dovrebbe restituire i permessi formattati', () => {
    const formattedPermissions = getPermissionsByRole(ROLES.ADMIN);
    expect(Array.isArray(formattedPermissions)).toBe(true);
    expect(formattedPermissions.length).toBeGreaterThan(0);
    expect(formattedPermissions[0]).toHaveProperty('id');
    expect(formattedPermissions[0]).toHaveProperty('name');
  });
});