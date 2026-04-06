const httpMocks = require('node-mocks-http');
const { createReactivationRequest } = require('../controllers/user.controller');
const User = require('../models/User');
const ReactivationRequest = require('../models/ReactivationRequest');

jest.mock('../models/User');
jest.mock('../models/ReactivationRequest');

describe('User Controller (White Box Testing)', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest({
      body: {
        email: 'suspended@example.com',
        reason: 'I want my account back'
      }
    });
    res = httpMocks.createResponse();
    jest.clearAllMocks();
  });

  it('should reject request if user is not found', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._getJSONData().message).toBe('User with this email not found');
  });

  it('should reject request if user is NOT suspended', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '123', status: 'active', email: 'suspended@example.com' });

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toBe('Account is not suspended');
  });

  it('should reject if there is already a pending request', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '123', status: 'suspended', email: 'suspended@example.com' });
    ReactivationRequest.findOne = jest.fn().mockResolvedValue({ status: 'pending' });

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(409);
    expect(res._getJSONData().message).toBe('You already have a pending reactivation request');
  });

  it('should successfully create a new request if valid', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '123', status: 'suspended', email: 'suspended@example.com' });
    ReactivationRequest.findOne = jest.fn().mockResolvedValue(null);
    ReactivationRequest.prototype.save = jest.fn().mockResolvedValue({});

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData().message).toBe('Reactivation request submitted successfully');
    expect(ReactivationRequest.prototype.save).toHaveBeenCalled();
  });
});
