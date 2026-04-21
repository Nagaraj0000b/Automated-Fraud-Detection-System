const RiskRule = require('../models/RiskRule');
const Transaction = require('../models/Transaction');
const connectDB = require('../config/database');
const { getTransactions, store } = require('./demoStore');

const severityWeights = {
  Low: 0.12,
  Medium: 0.2,
  High: 0.3,
  Critical: 0.45,
};

const actionWeights = {
  review: 0.12,
  flag: 0.2,
  block: 0.3,
};

const compare = (left, operator, right) => {
  switch (operator) {
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    default:
      return false;
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normaliseLocation = (location = '') => String(location || '').trim().toLowerCase();
const normaliseText = (value = '') => String(value || '').trim();
const locationToken = (location = '') =>
  String(location || '')
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .pop() || '';
const isForeignLocation = (location = '') => {
  if (!String(location || '').includes(',')) {
    return false;
  }

  const token = locationToken(location);
  if (!token) return false;
  if (['IN', 'INDIA'].includes(token)) return false;
  if (token.length !== 2) return false;
  return true;
};
const toRiskLevel = (scorePercent = 0) => {
  if (scorePercent >= 85) return 'CRITICAL_RISK';
  if (scorePercent >= 70) return 'HIGH_RISK';
  if (scorePercent >= 45) return 'MEDIUM_RISK';
  return 'LOW_RISK';
};

const evaluateRules = (rules, metrics) => {
  const triggeredRules = [];
  let ruleScore = 0;
  let strongestAction = 'approve';

  for (const rule of rules) {
    if (!rule.isActive) continue;

    const metricValue = metrics[rule.targetField];
    if (metricValue === undefined || metricValue === null) continue;

    if (compare(metricValue, rule.operator, rule.value)) {
      const weight = (severityWeights[rule.severity] || 0.1) + (actionWeights[rule.action] || 0.08);
      ruleScore += weight;
      triggeredRules.push({
        id: rule._id,
        name: rule.name,
        action: rule.action,
        severity: rule.severity,
        reasonCode: `RULE_${String(rule.targetField).toUpperCase()}_${String(rule.action).toUpperCase()}`,
        metric: rule.targetField,
        value: metricValue,
        threshold: rule.value,
      });

      if (rule.action === 'block') {
        strongestAction = 'block';
      } else if (rule.action === 'flag' && strongestAction !== 'block') {
        strongestAction = 'flag';
      } else if (rule.action === 'review' && strongestAction === 'approve') {
        strongestAction = 'review';
      }
    }
  }

  return { triggeredRules, ruleScore, strongestAction };
};

exports.scoreTransaction = async ({
  userId,
  amount,
  transactionType,
  recipient,
  description,
  location,
  recentTransactionsOverride = null,
  nowOverride = null,
}) => {
  const normalizedAmount = Number(amount) || 0;
  const normalizedRecipient = normaliseText(recipient);
  const normalizedDescription = normaliseText(description);
  const normalizedLocation = normaliseText(location);

  const [activeRules, recentTransactions] = recentTransactionsOverride
    ? [
        connectDB.isConnected() ? await RiskRule.find({ isActive: true }).lean() : store.rules.filter((rule) => rule.isActive),
        recentTransactionsOverride,
      ]
    : connectDB.isConnected()
      ? await Promise.all([
          RiskRule.find({ isActive: true }).lean(),
          Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('amount createdAt location status transactionType recipient'),
        ])
      : [
          store.rules.filter((rule) => rule.isActive),
          getTransactions()
            .filter((txn) => txn.user === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20),
        ];

  const now = nowOverride ? new Date(nowOverride) : new Date();
  const recent30Min = recentTransactions.filter(
    (txn) => now - new Date(txn.createdAt) <= 30 * 60 * 1000
  );
  const recent10Min = recentTransactions.filter(
    (txn) => now - new Date(txn.createdAt) <= 10 * 60 * 1000
  );
  const recent24h = recentTransactions.filter(
    (txn) => now - new Date(txn.createdAt) <= 24 * 60 * 60 * 1000
  );
  const historicalAmounts = recentTransactions.map((txn) => Number(txn.amount || 0)).filter(Boolean);
  const averageAmount = historicalAmounts.length
    ? historicalAmounts.reduce((sum, value) => sum + value, 0) / historicalAmounts.length
    : normalizedAmount;
  const knownRecipients = new Set(recentTransactions.map((txn) => normaliseText(txn.recipient).toLowerCase()).filter(Boolean));
  const blockedHistoryCount = recentTransactions.filter((txn) => txn.status === 'blocked').length;
  const suspiciousHistoryCount = recentTransactions.filter((txn) => ['flagged', 'blocked'].includes(txn.status)).length;
  const latestLocation = recentTransactions.find((txn) => txn.location)?.location || '';
  const locationChanged =
    normaliseLocation(normalizedLocation) &&
    normaliseLocation(latestLocation) &&
    normaliseLocation(normalizedLocation) !== normaliseLocation(latestLocation);
  const foreignLocation = isForeignLocation(normalizedLocation);
  const veryHighAmount = normalizedAmount >= 100000 || normalizedAmount >= averageAmount * 6;
  const highAmount = normalizedAmount >= 50000 || normalizedAmount >= averageAmount * 2.5;
  const impossibleTravel = foreignLocation && recent30Min.length > 0;

  const metrics = {
    amount: normalizedAmount,
    velocity: recent30Min.length + 1,
    velocity10m: recent10Min.length + 1,
    dailyTotal: recent24h.reduce((sum, txn) => sum + txn.amount, 0) + normalizedAmount,
    location: locationChanged ? 1 : 0,
    device: 0,
  };

  let heuristicScore = 0.02;
  const reasons = [];
  const reasonCodes = [];
  const actionQueue = [];

  if (veryHighAmount) {
    heuristicScore += 0.55;
    reasons.push('Very high amount detected');
    reasonCodes.push('AMOUNT_VERY_HIGH');
    actionQueue.push('block');
  } else if (highAmount) {
    heuristicScore += 0.24;
    reasons.push('Amount is higher than normal pattern');
    reasonCodes.push('AMOUNT_HIGH');
    actionQueue.push('notify');
  } else {
    reasonCodes.push('AMOUNT_NORMAL');
  }

  if (impossibleTravel) {
    heuristicScore += 0.65;
    reasons.push('Impossible travel pattern detected');
    reasonCodes.push('LOCATION_IMPOSSIBLE_TRAVEL');
    actionQueue.push('block');
  } else if (foreignLocation) {
    heuristicScore += 0.55;
    reasons.push('Foreign location detected');
    reasonCodes.push('LOCATION_FOREIGN');
    actionQueue.push('block');
  } else if (locationChanged) {
    heuristicScore += 0.18;
    reasons.push('Location does not match recent activity');
    reasonCodes.push('LOCATION_SUSPICIOUS');
    actionQueue.push('notify');
  } else {
    reasonCodes.push('LOCATION_MATCH');
  }

  if (transactionType === 'transfer') {
    reasonCodes.push('TRANSFER_FLOW');
  }

  const { triggeredRules, ruleScore, strongestAction } = evaluateRules(activeRules, metrics);
  const riskScore = clamp(Number((heuristicScore + ruleScore).toFixed(4)), 0.01, 0.99);
  const riskScorePercent = Math.round(riskScore * 100);
  const riskLevel = toRiskLevel(riskScorePercent);

  let recommendedStatus = 'approved';
  const shouldBlock =
    strongestAction === 'block' ||
    actionQueue.includes('block') ||
    (riskScorePercent >= 80 &&
      (highAmount || foreignLocation || impossibleTravel));
  const shouldNotify =
    strongestAction === 'flag' ||
    strongestAction === 'review' ||
    actionQueue.includes('notify') ||
    riskScorePercent >= 45;

  if (shouldBlock) {
    recommendedStatus = 'blocked';
  } else if (shouldNotify) {
    recommendedStatus = 'flagged';
  }

  return {
    riskScore,
    riskScorePercent,
    riskLevel,
    recommendedStatus,
    reasons,
    reasonCodes: Array.from(new Set([...reasonCodes, ...triggeredRules.map((rule) => rule.reasonCode)])),
    metrics,
    triggeredRules,
    modelSummary: {
      engine: 'FraudGuard Hybrid Engine',
      mode: activeRules.length ? 'rules-plus-heuristics' : 'heuristics-fallback',
      evaluatedRules: activeRules.length,
    },
  };
};
