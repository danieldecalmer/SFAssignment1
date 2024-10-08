jest.mock('../models/userModel'); // Mock the user model

const User = require('../models/userModel');

test('should create a user', async () => {
  User.create.mockResolvedValue({ username: 'testuser' });
  const response = await request(app).post('/register').send({ username: 'testuser', password: 'password123' });
  expect(response.statusCode).toBe(201);
  expect(response.body.username).toBe('testuser');
});
