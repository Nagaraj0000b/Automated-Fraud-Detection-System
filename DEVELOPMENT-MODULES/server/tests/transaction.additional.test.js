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

  // Register a user to obtain a valid JWT
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Additional Test User',
      email: 'addtest@example.com',
      password: 'password123'
    });
  authToken = signupRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Transaction API – Additional Edge Cases (Black Box)', () => {
  // TC‑TX‑03 – Boundary amount at 50000 (approved)
  it('should approve a transaction exactly at the 50000 boundary (201)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 50000,
        transactionType: 'transfer',
        recipient: 'boundary@example.com',
        description: 'Boundary amount test'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.amount).toBe(50000);
    expect(res.body.status).toBe('approved');
  });

  // TC‑TX‑05 – Very large transaction above block threshold (120000) → blocked
  it('should block a transaction above 100000 (120000) (201 with blocked status)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 120000,
        transactionType: 'transfer',
        recipient: 'bigspender@example.com',
        description: 'Very large transaction'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.amount).toBe(120000);
    expect(res.body.status).toBe('blocked');
  });

  // TC‑TX‑06 – Negative amount transaction → 400 Bad Request
  it('should reject a transaction with a negative amount (400)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: -500,
        transactionType: 'transfer',
        recipient: 'negative@example.com',
        description: 'Negative amount test'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid transaction amount');
  });

  // TC‑TX‑07 – Missing recipient field → 400 Bad Request
  it('should reject a transaction missing the recipient (400)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 2000,
        transactionType: 'transfer',
        // recipient omitted on purpose
        description: 'Missing recipient test'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Recipient is required');
  });

  // TC‑TX‑08 – Unsupported transaction type → 400 Bad Request
  it('should reject a transaction with an unsupported type (400)', async () => {
    const res = await request(app)
      .post('/api/transactions/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 2000,
        transactionType: 'billpay', // not in the allowed enum
        recipient: 'unsupported@example.com',
        description: 'Unsupported type test'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid transaction type');
  });
});
