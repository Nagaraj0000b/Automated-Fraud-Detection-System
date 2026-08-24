const httpMocks = require('node-mocks-http');
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/riskRule.controller');
const RiskRule = require('../models/RiskRule');
const { createAuditLog } = require('../controllers/audit.controller');

jest.mock('../controllers/audit.controller', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

describe('RiskRule Controller (White Box Testing)', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest({
      user: { userId: 'admin123', name: 'Admin User', role: 'admin' }
    });
    res = httpMocks.createResponse();
    jest.clearAllMocks();
  });

  describe('getRules', () => {
    it('returns all rules sorted by newest first', async () => {
      const mockRules = [{ _id: 'r1', name: 'High amount' }];
      RiskRule.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(mockRules) });

      await getRules(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.success).toBe(true);
      expect(data.rules).toEqual(mockRules);
    });
  });

  describe('createRule', () => {
    it('rejects a rule missing required fields', async () => {
      req.body = { name: 'Incomplete rule' };

      await createRule(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().success).toBe(false);
    });

    it('creates a rule and writes an audit log', async () => {
      req.body = {
        name: 'Large transfer',
        targetField: 'amount',
        operator: '>',
        value: 5000,
        action: 'block',
        severity: 'high',
      };

      jest.spyOn(RiskRule.prototype, 'save').mockResolvedValue({});

      await createRule(req, res);

      expect(res.statusCode).toBe(201);
      const data = res._getJSONData();
      expect(data.success).toBe(true);
      expect(data.rule.name).toBe('Large transfer');
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Risk Rule Created', actorName: 'Admin User' })
      );

      RiskRule.prototype.save.mockRestore();
    });
  });

  describe('updateRule', () => {
    it('returns 404 when the rule does not exist', async () => {
      req.params = { id: 'missing' };
      req.body = { enabled: false };
      RiskRule.findById = jest.fn().mockResolvedValue(null);

      await updateRule(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('toggles enabled state and logs the audit action', async () => {
      req.params = { id: 'r1' };
      req.body = { enabled: false };
      const mockRule = { _id: 'r1', name: 'Large transfer', enabled: true, save: jest.fn().mockResolvedValue(true) };
      RiskRule.findById = jest.fn().mockResolvedValue(mockRule);

      await updateRule(req, res);

      expect(mockRule.enabled).toBe(false);
      expect(mockRule.save).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Risk Rule Disabled' })
      );
    });
  });

  describe('deleteRule', () => {
    it('returns 404 when the rule does not exist', async () => {
      req.params = { id: 'missing' };
      RiskRule.findById = jest.fn().mockResolvedValue(null);

      await deleteRule(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('deletes the rule and logs the audit action', async () => {
      req.params = { id: 'r1' };
      const mockRule = { _id: 'r1', name: 'Large transfer', deleteOne: jest.fn().mockResolvedValue(true) };
      RiskRule.findById = jest.fn().mockResolvedValue(mockRule);

      await deleteRule(req, res);

      expect(mockRule.deleteOne).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Risk Rule Deleted' })
      );
    });
  });
});
