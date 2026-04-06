const httpMocks = require('node-mocks-http');
const { createTransaction } = require('../controllers/transaction.controller');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

jest.mock('../models/User');

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
});
