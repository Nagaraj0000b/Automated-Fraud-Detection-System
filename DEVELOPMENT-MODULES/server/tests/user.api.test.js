const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let app;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  app = require('../server');

  // Create standard user
  const userRes = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Standard User', email: 'stduser@example.com', password: 'password123' });
  userToken = userRes.body.token;

  // Manually make an admin user in the database (since signup makes regular users)
  const User = require('../models/User');
  const adminUser = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'hashedpassword',
    role: 'admin',
    status: 'active'
  });
  await adminUser.save();

  // Sign in as admin to get token
  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign(
    { userId: adminUser._id, email: adminUser.email, role: 'admin' },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '24h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User API (Black Box Testing)', () => {

  it('should allow public access to submit reactivation request', async () => {
    // Note: We expect a 404 here because the user doesn't exist yet, 
    // but the important part is it DOES NOT return 401/403
    const res = await request(app)
      .post('/api/users/reactivation-request')
      .send({ email: 'nonexistent@example.com', reason: 'please' });

    expect(res.statusCode).toBe(404);
  });

  it('should deny non-admins from getting the user list (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Admin access required');
  });

  it('should allow admins to get the user list (200 OK)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
