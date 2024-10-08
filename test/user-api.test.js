const request = require('supertest');
const app = require('../backend/server'); // Import your Express server

describe('User API Endpoints', () => {
  test('GET /users should return a list of users', async () => {
    const response = await request(app).get('/users');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  test('POST /login should authenticate a user', async () => {
    const loginDetails = {
      username: 'testuser',
      password: 'password123'
    };
    const response = await request(app).post('/login').send(loginDetails);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('logged in successfully');
  });

  test('POST /register should create a new user', async () => {
    const newUser = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123'
    };
    const response = await request(app).post('/register').send(newUser);
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain('Account created successfully');
  });
});
