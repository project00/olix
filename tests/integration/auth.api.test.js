const request = require('supertest');
const app = require('../../app');
const { sequelize, User } = require('../../models');

// Use a separate test database if configured, or sync the current one
beforeAll(async () => {
  await sequelize.sync({ force: true }); // Clears the database and recreates tables
});

describe('Auth API', () => {
  // Clean up users table before each test to ensure isolation
  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  // --- Registration Tests ---
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');

      // Verify user was actually created in the database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user).not.toBeNull();
    });

    it('should fail to register a user with an existing email', async () => {
      // First, create a user
      await User.create({ email: 'exists@example.com', password_hash: 'somehash' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'exists@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User with this email already exists.');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toBe('Please include a valid email');
    });

    it('should fail if password is less than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toBe('Password must be 6 or more characters');
    });
  });

  // --- Login Tests ---
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // The beforeCreate hook will hash the password
      await User.create({ email: 'login@example.com', password_hash: 'password123' });
    });

    it('should log in a registered user successfully and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail to log in with an incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials.');
    });

    it('should fail to log in with a non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nosuchuser@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials.');
    });
  });
});

afterAll(async () => {
  await sequelize.close(); // Close the database connection
});
