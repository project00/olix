// backend/tests/integration/roles.api.test.js
const request = require('supertest');
const app = require('../../app');
const db = require('../../models');

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

  test('GET /api/roles/:id/permissions dovrebbe restituire i permessi di un ruolo', async () => {
    const response = await request(app)
      .get('/api/roles/1/permissions')
      .set('Authorization', `Bearer ${token}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('role');
    expect(response.body).toHaveProperty('permissions');
  });
  
  test('POST /api/roles dovrebbe creare un nuovo ruolo', async () => {
    const newRole = {
      name: 'TEST_ROLE',
      permissions: ['user:view', 'service:view']
    };
    
    const response = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .send(newRole);
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'TEST_ROLE');
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });
  
  test('POST /api/roles dovrebbe restituire errore se manca il nome', async () => {
    const invalidRole = {
      permissions: ['user:view']
    };
    
    const response = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidRole);
      
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/roles/:id/users dovrebbe restituire gli utenti di un ruolo', async () => {
    const response = await request(app)
      .get('/api/roles/1/users')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});