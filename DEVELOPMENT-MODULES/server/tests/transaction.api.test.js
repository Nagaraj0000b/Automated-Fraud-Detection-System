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

  // Create a user and get token to use in transaction tests
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Tx Test User',
      email: 'txtest@example.com',
      password: 'password123'
    });
    
  authToken = signupRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Transaction API (Black Box Testing)', () => {
  
  it('should fail to create transaction if unauthenticated (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .send({ amount: 1000, recipient: 'bob@example.com' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Access token required');
  });

  it('should successfully create a normal transaction (201 Created)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 5000,
        transactionType: 'transfer',
        recipient: 'alice@example.com',
        description: 'Rent payment'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.amount).toBe(5000);
    expect(res.body.status).toBe('approved');
  });

  it('should auto-flag a large transaction (201 Created)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 80000,
        transactionType: 'transfer',
        recipient: 'car_dealership@example.com',
        description: 'New car'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.amount).toBe(80000);
    expect(res.body.status).toBe('flagged');
  });

  it('should fallback securely when missing required transaction data (500/400)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 5000 }); // Missing recipient, transactionType, etc.

    // Mongoose validation catches it; controller handles error
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Transaction failed');
  });
});
