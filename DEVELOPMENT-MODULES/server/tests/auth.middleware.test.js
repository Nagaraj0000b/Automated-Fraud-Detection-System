const jwt = require('jsonwebtoken');
const httpMocks = require('node-mocks-http');
const { verifyToken } = require('../middleware/auth.middleware');
const User = require('../models/User');

jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Middleware (White Box Testing)', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() if valid token is provided', async () => {
    req.headers['authorization'] = 'Bearer valid-token';
    const decodedPayload = { userId: '123' };
    
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, decodedPayload);
    });

    User.findById.mockResolvedValue({ _id: '123', status: 'active' });

    await verifyToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String), expect.any(Function));
    expect(User.findById).toHaveBeenCalledWith('123');
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    verifyToken(req, res, next);
    
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Access token required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', () => {
    req.headers['authorization'] = 'Bearer invalid-token';
    
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('jwt expired'), null);
    });

    verifyToken(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      success: false,
      message: 'Invalid or expired token'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
