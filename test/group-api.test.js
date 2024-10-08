const request = require('supertest');
const app = require('../backend/server');

describe('Group API Endpoints', () => {
  test('GET /groups should return all groups', async () => {
    const response = await request(app).get('/groups');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  test('POST /groups should create a new group', async () => {
    const newGroup = {
      name: 'Test Group',
      members: ['testuser'],
      groupAdmin: 'testuser'
    };
    const response = await request(app).post('/groups').send(newGroup);
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toContain('Group created successfully');
  });

  test('DELETE /groups/:name should delete a group', async () => {
    const groupName = 'Test Group';
    const response = await request(app).delete(`/groups/${groupName}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('Group deleted successfully');
  });
});
