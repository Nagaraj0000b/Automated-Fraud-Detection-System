const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let app;

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  // Set the connection string to the in-memory instance
  process.env.MONGODB_URI = mongoServer.getUri();
  
  // Require app AFTER setting the URI so connectDB() uses the memory server
  app = require('../server');
});

afterAll(async () => {
  // Disconnect and stop memory server after tests
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API (Black Box Testing)', () => {
  
  it('should fail login with missing data (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@example.com' }); // Missing password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email and password are required');
  });

  it('should fail login with wrong credentials (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should successfully sign up a new user (201 Created)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.token).toBeDefined();
  });
});
