const RiskRule = require('../models/RiskRule');

// Comparison operators supported by risk rules.
const OPERATORS = {
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b, // eslint-disable-line eqeqeq
  '!=': (a, b) => a != b, // eslint-disable-line eqeqeq
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};

// Numeric fields need numeric coercion so "5000" > 1000 works as expected.
const NUMERIC_FIELDS = new Set(['amount']);

const SEVERITY_RISK_SCORE = {
  low: 0.4,
  medium: 0.6,
  high: 0.85,
  critical: 0.99,
};

function ruleMatches(rule, transactionData) {
  const rawField = transactionData[rule.targetField];
  if (rawField === undefined || rawField === null) return false;

  const compare = OPERATORS[rule.operator];
  if (!compare) return false;

  let fieldValue = rawField;
  let ruleValue = rule.value;
  if (NUMERIC_FIELDS.has(rule.targetField)) {
    fieldValue = Number(fieldValue);
    ruleValue = Number(ruleValue);
    if (Number.isNaN(fieldValue) || Number.isNaN(ruleValue)) return false;
  }

  try {
    return Boolean(compare(fieldValue, ruleValue));
  } catch (error) {
    return false;
  }
}

// Fallback heuristic used only when no enabled rule matches the transaction,
// so behavior is sane even before an admin configures any rules.
function baselineHeuristic(transactionData) {
  const amount = Number(transactionData.amount) || 0;
  if (amount > 100000) {
    return { status: 'blocked', riskScore: 0.99, triggeredRules: [] };
  }
  if (amount > 50000) {
    return { status: 'flagged', riskScore: 0.85, triggeredRules: [] };
  }
  return { status: 'approved', riskScore: 0, triggeredRules: [] };
}

/**
 * Evaluate a transaction against all enabled risk rules.
 * @param {Object} transactionData - { amount, transactionType, recipient, location, description }
 * @returns {Promise<{status: string, riskScore: number, triggeredRules: Array}>}
 */
async function evaluateTransaction(transactionData) {
  const rules = await RiskRule.find({ enabled: true });

  const triggered = rules.filter((rule) => ruleMatches(rule, transactionData));

  if (triggered.length === 0) {
    return baselineHeuristic(transactionData);
  }

  const blockingRule = triggered.find((rule) => rule.action === 'block');
  const riskScore = Math.max(
    ...triggered.map((rule) => SEVERITY_RISK_SCORE[rule.severity] || 0.5)
  );

  return {
    status: blockingRule ? 'blocked' : 'flagged',
    riskScore,
    triggeredRules: triggered.map((rule) => ({
      ruleId: rule._id,
      name: rule.name,
      severity: rule.severity,
      action: rule.action,
    })),
  };
}

module.exports = { evaluateTransaction, OPERATORS };
