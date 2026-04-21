const httpMocks = require('node-mocks-http');
const { createReactivationRequest, unblockUser, updateReactivationRequestStatus } = require('../controllers/user.controller');
const User = require('../models/User');
const ReactivationRequest = require('../models/ReactivationRequest');
const { createAuditLog } = require('../controllers/audit.controller');

jest.mock('../models/User');
jest.mock('../models/ReactivationRequest');
jest.mock('../controllers/audit.controller', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

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

  it('should append message if there is already a pending request', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '123', status: 'suspended', email: 'suspended@example.com' });
    
    const mockExistingRequest = { 
      status: 'pending', 
      messages: [], 
      save: jest.fn().mockResolvedValue(true) 
    };
    ReactivationRequest.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockExistingRequest)
    });

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().message).toBe('Message sent successfully');
  });

  it('should successfully create a new request if valid', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '123', status: 'suspended', email: 'suspended@example.com' });
    ReactivationRequest.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });
    ReactivationRequest.prototype.save = jest.fn().mockResolvedValue({});

    await createReactivationRequest(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData().message).toBe('Reactivation request submitted successfully');
    expect(ReactivationRequest.prototype.save).toHaveBeenCalled();
  });

  describe('unblockUser logic', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({ params: { id: 'user123' }, user: { userId: 'admin123', name: 'Admin' } });
      res = httpMocks.createResponse();
    });

    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);
      await unblockUser(req, res);
      expect(res.statusCode).toBe(404);
    });

    it('should successfully unblock user, update requests, and log audit', async () => {
      const mockUser = { _id: 'user123', status: 'suspended', email: 'test@example.com', save: jest.fn() };
      User.findById = jest.fn().mockResolvedValue(mockUser);
      ReactivationRequest.updateMany = jest.fn().mockResolvedValue({});

      await unblockUser(req, res);

      expect(mockUser.status).toBe('active');
      expect(mockUser.save).toHaveBeenCalled();
      expect(ReactivationRequest.updateMany).toHaveBeenCalledWith(
        { user: 'user123', status: 'pending' },
        { $set: { status: 'approved', adminNotes: expect.any(String) } }
      );
      expect(createAuditLog).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });

  describe('updateReactivationRequestStatus logic', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({ 
        params: { id: 'req123' }, 
        body: { status: 'approved', adminNotes: 'Looks good' },
        user: { userId: 'admin123' }
      });
      res = httpMocks.createResponse();
    });

    it('should return 400 for invalid status', async () => {
      req.body.status = 'invalid_status';
      await updateReactivationRequestStatus(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should approve request, unblock user, and log audit', async () => {
      const mockUser = { _id: 'user123', status: 'suspended', email: 'user@example.com', save: jest.fn() };
      const mockRequest = { _id: 'req123', status: 'pending', user: mockUser, messages: [], save: jest.fn() };
      ReactivationRequest.findById = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(mockRequest) });

      await updateReactivationRequestStatus(req, res);

      expect(mockRequest.status).toBe('approved');
      expect(mockUser.status).toBe('active');
      expect(createAuditLog).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });
});
