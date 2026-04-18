const httpMocks = require('node-mocks-http');
const { getStats } = require('../controllers/dashboard.controller');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

jest.mock('../models/User');
jest.mock('../models/Transaction');

describe('Dashboard Controller (White Box Testing)', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    jest.clearAllMocks();
  });

  it('should calculate stats and approval rate correctly', async () => {
    // Mock user statistics
    User.countDocuments = jest.fn()
      .mockResolvedValueOnce(10)  // total users
      .mockResolvedValueOnce(8)   // active users
      .mockResolvedValueOnce(2)   // admin users
      .mockResolvedValueOnce(5);  // recent signups

    User.aggregate = jest.fn().mockResolvedValue([ { _id: 'admin', count: 2 } ]);

    // Mock transaction statistics
    Transaction.countDocuments = jest.fn()
      .mockResolvedValueOnce(100) // total txns
      .mockResolvedValueOnce(10)  // flagged
      .mockResolvedValueOnce(5)   // blocked
      .mockResolvedValueOnce(85); // approved

    await getStats(req, res);

    expect(res.statusCode).toBe(200);
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    
    // Check if the approval rate calculation logic worked (85/100 = 85.0%)
    expect(responseData.stats.transactions.approvalRate).toBe('85.0%');
    expect(responseData.stats.users.total).toBe(10);
  });

  it('should return 0% approval rate if no transactions exist', async () => {
    User.countDocuments = jest.fn().mockResolvedValue(0);
    User.aggregate = jest.fn().mockResolvedValue([]);
    
    // 0 total transactions
    Transaction.countDocuments = jest.fn().mockResolvedValue(0);

    await getStats(req, res);

    const responseData = res._getJSONData();
    expect(responseData.stats.transactions.approvalRate).toBe('0%');
  });
});
