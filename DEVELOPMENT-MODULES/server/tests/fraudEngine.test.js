const { evaluateTransaction } = require('../services/fraudEngine');
const RiskRule = require('../models/RiskRule');

jest.mock('../models/RiskRule');

describe('fraudEngine.evaluateTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('baseline heuristic (no configured rules)', () => {
    beforeEach(() => {
      RiskRule.find = jest.fn().mockResolvedValue([]);
    });

    it('approves transactions at/under 50,000 with 0 risk score', async () => {
      const result = await evaluateTransaction({ amount: 50000, transactionType: 'transfer', recipient: 'bob' });
      expect(result).toEqual({ status: 'approved', riskScore: 0, triggeredRules: [] });
    });

    it('flags transactions between 50,000 and 100,000', async () => {
      const result = await evaluateTransaction({ amount: 60000, transactionType: 'transfer', recipient: 'bob' });
      expect(result.status).toBe('flagged');
      expect(result.riskScore).toBe(0.85);
    });

    it('blocks transactions over 100,000', async () => {
      const result = await evaluateTransaction({ amount: 150000, transactionType: 'transfer', recipient: 'bob' });
      expect(result.status).toBe('blocked');
      expect(result.riskScore).toBe(0.99);
    });
  });

  describe('custom risk rules', () => {
    it('flags a transaction that matches an enabled "flag" rule', async () => {
      RiskRule.find = jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'Small suspicious transfer', targetField: 'amount', operator: '>', value: 100, action: 'flag', severity: 'medium', enabled: true },
      ]);

      const result = await evaluateTransaction({ amount: 500, transactionType: 'transfer', recipient: 'bob' });

      expect(result.status).toBe('flagged');
      expect(result.riskScore).toBe(0.6);
      expect(result.triggeredRules).toHaveLength(1);
      expect(result.triggeredRules[0].name).toBe('Small suspicious transfer');
    });

    it('blocks when any triggered rule has action "block", even if others only flag', async () => {
      RiskRule.find = jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'Flag rule', targetField: 'amount', operator: '>', value: 100, action: 'flag', severity: 'low', enabled: true },
        { _id: 'r2', name: 'Block rule', targetField: 'amount', operator: '>', value: 100, action: 'block', severity: 'critical', enabled: true },
      ]);

      const result = await evaluateTransaction({ amount: 500, transactionType: 'transfer', recipient: 'bob' });

      expect(result.status).toBe('blocked');
      expect(result.riskScore).toBe(0.99);
      expect(result.triggeredRules).toHaveLength(2);
    });

    it('evaluates the "contains" operator against string fields', async () => {
      RiskRule.find = jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'Known risky merchant', targetField: 'recipient', operator: 'contains', value: 'scam', action: 'block', severity: 'critical', enabled: true },
      ]);

      const result = await evaluateTransaction({ amount: 10, transactionType: 'transfer', recipient: 'ScamCorp Ltd' });

      expect(result.status).toBe('blocked');
      expect(result.triggeredRules[0].name).toBe('Known risky merchant');
    });

    it('falls back to the baseline heuristic when no rule matches', async () => {
      RiskRule.find = jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'High amount rule', targetField: 'amount', operator: '>', value: 1000000, action: 'block', severity: 'critical', enabled: true },
      ]);

      const result = await evaluateTransaction({ amount: 5000, transactionType: 'transfer', recipient: 'bob' });

      expect(result.status).toBe('approved');
      expect(result.riskScore).toBe(0);
    });

    it('ignores rules whose target field is missing on the transaction', async () => {
      RiskRule.find = jest.fn().mockResolvedValue([
        { _id: 'r1', name: 'Location rule', targetField: 'location', operator: 'contains', value: 'unknown', action: 'block', severity: 'critical', enabled: true },
      ]);

      const result = await evaluateTransaction({ amount: 10, transactionType: 'transfer', recipient: 'bob' });

      expect(result.status).toBe('approved');
    });
  });
});
