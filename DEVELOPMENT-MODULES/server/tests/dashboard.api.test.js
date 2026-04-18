const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let app;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  app = require('../server');

  // Sign up to get token
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Dash User', email: 'dash@example.com', password: 'password123' });
  authToken = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Dashboard API (Black Box Testing)', () => {

  it('should reject access to stats if unauthenticated (401)', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.statusCode).toBe(401);
  });

  it('should fetch dashboard stats successfully when authenticated (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.users).toBeDefined();
    expect(res.body.stats.transactions).toBeDefined();
  });

  it('should fetch recent users successfully when authenticated (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent-users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
