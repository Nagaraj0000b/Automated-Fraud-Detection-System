const httpMocks = require('node-mocks-http');
const { createTransaction, updateTransactionStatus, raiseDispute } = require('../controllers/transaction.controller');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createAuditLog } = require('../controllers/audit.controller');

jest.mock('../models/User');
jest.mock('../controllers/audit.controller', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

describe('Transaction Controller (White Box Testing)', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest({
      user: { userId: 'user123' },
      body: {
        amount: 0,
        transactionType: 'transfer',
        recipient: 'test@example.com',
        description: 'Test transfer'
      }
    });
    res = httpMocks.createResponse();
    jest.clearAllMocks();
  });

  it('should approve transactions under 50,000 with 0 risk score', async () => {
    req.body.amount = 10000;
    
    // Stub save function on Transaction prototype
    jest.spyOn(Transaction.prototype, 'save').mockResolvedValue({});
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await createTransaction(req, res);

    expect(res.statusCode).toBe(201);
    const responseData = res._getJSONData();
    expect(responseData.status).toBe('approved');
    expect(responseData.riskScore).toBe(0);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $inc: { accountBalance: -10000 } });
    
    Transaction.prototype.save.mockRestore();
  });

  it('should flag transactions between 50,000 and 100,000', async () => {
    req.body.amount = 60000;
    
    jest.spyOn(Transaction.prototype, 'save').mockResolvedValue({});
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await createTransaction(req, res);

    expect(res.statusCode).toBe(201);
    const responseData = res._getJSONData();
    expect(responseData.status).toBe('flagged');
    expect(responseData.riskScore).toBe(0.85);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $inc: { accountBalance: -60000 } });
    
    Transaction.prototype.save.mockRestore();
  });

  it('should block transactions over 100,000 and NOT decrease balance', async () => {
    req.body.amount = 150000;
    
    jest.spyOn(Transaction.prototype, 'save').mockResolvedValue({});
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    await createTransaction(req, res);

    expect(res.statusCode).toBe(201);
    const responseData = res._getJSONData();
    expect(responseData.status).toBe('blocked');
    expect(responseData.riskScore).toBe(0.99);
    // User balance should not be decreased if blocked
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    
    Transaction.prototype.save.mockRestore();
  });

  describe('updateTransactionStatus logic', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        params: { transactionId: 'tx123' },
        body: { status: 'approved' },
        user: { userId: 'admin123', name: 'Admin' }
      });
    });

    it('should return 400 for invalid status', async () => {
      req.body.status = 'unknown';
      await updateTransactionStatus(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toBe('Invalid status');
    });

    it('should update transaction status and log audit', async () => {
      const mockTx = { _id: 'tx123', status: 'flagged', amount: 500, recipient: 'test', save: jest.fn() };
      Transaction.findById = jest.fn().mockResolvedValue(mockTx);

      await updateTransactionStatus(req, res);

      expect(mockTx.status).toBe('approved');
      expect(mockTx.save).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });

  describe('raiseDispute logic', () => {
    beforeEach(() => {
      req = httpMocks.createRequest({
        params: { transactionId: 'tx123' },
        body: { reason: 'Unauthorized charge' },
        user: { userId: 'user123' }
      });
    });

    it('should return 404 if transaction is not found or unowned', async () => {
      Transaction.findOne = jest.fn().mockResolvedValue(null);
      await raiseDispute(req, res);
      expect(res.statusCode).toBe(404);
    });

    it('should successfully raise dispute', async () => {
      const mockTx = { _id: 'tx123', disputeStatus: 'none', save: jest.fn() };
      Transaction.findOne = jest.fn().mockResolvedValue(mockTx);

      await raiseDispute(req, res);

      expect(mockTx.disputeStatus).toBe('open');
      expect(mockTx.disputeReason).toBe('Unauthorized charge');
      expect(mockTx.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });
});
