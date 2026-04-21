const { predict } = require('../ml/predict');
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
            .limit(50) // Increased limit to better calculate daily total and frequency
            .select('amount createdAt location status transactionType recipient'),
        ])
      : [
          store.rules.filter((rule) => rule.isActive),
          getTransactions()
            .filter((txn) => txn.user === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50),
        ];

  const now = nowOverride ? new Date(nowOverride) : new Date();
  
  // --- 🚨 MANDATORY HARD RULES START ---
  let mandatoryStatus = 'approved';
  const mandatoryReasons = [];
  const mandatoryCodes = [];

  // Rule 1: Single Transaction Limit (₹5,000)
  if (normalizedAmount > 5000) {
    mandatoryStatus = 'blocked';
    mandatoryReasons.push('Transaction amount exceeds ₹5,000 limit');
    mandatoryCodes.push('SINGLE_TXN_LIMIT_EXCEEDED');
  }

  // Rule 2: Daily Transaction Limit (₹2,50,000)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dailyTotal = recentTransactions
    .filter(txn => new Date(txn.createdAt) >= startOfDay)
    .reduce((sum, txn) => sum + Number(txn.amount || 0), 0) + normalizedAmount;
  
  if (dailyTotal > 250000) {
    mandatoryStatus = 'blocked';
    mandatoryReasons.push('Daily transaction limit of ₹2,50,000 exceeded');
    mandatoryCodes.push('DAILY_LIMIT_EXCEEDED');
  }

  // Rule 3: Location Rule
  const parseLoc = (locStr) => {
    if (!locStr) return { city: null, country: null };
    const parts = locStr.split(',').map(s => s.trim().toLowerCase());
    if (parts.length >= 2) return { city: parts[0], country: parts[1] };
    // Fallback: try to detect if it's a country (simplified)
    const commonCountries = ['us', 'usa', 'india', 'uk', 'canada', 'germany', 'france', 'china', 'japan'];
    if (commonCountries.includes(parts[0])) return { city: null, country: parts[0] };
    return { city: parts[0], country: 'unknown' };
  };

  const curr = parseLoc(normalizedLocation);
  const lastTx = recentTransactions[0]; // most recent
  if (lastTx) {
    const last = parseLoc(lastTx.location);
    if (curr.country && last.country && curr.country !== last.country) {
      mandatoryStatus = 'blocked';
      mandatoryReasons.push('Transaction from different country');
      mandatoryCodes.push('DIFFERENT_COUNTRY');
    } else if (curr.city && last.city && curr.city !== last.city) {
      if (mandatoryStatus !== 'blocked') mandatoryStatus = 'flagged';
      mandatoryReasons.push('Transaction from different city');
      mandatoryCodes.push('CITY_CHANGE');
    }
  }

  // Rule 4: Transaction Frequency (1 min)
  const oneMinAgo = new Date(now.getTime() - 60000);
  const freqCount = recentTransactions.filter(txn => new Date(txn.createdAt) >= oneMinAgo).length + 1;
  if (freqCount >= 6) {
    mandatoryStatus = 'blocked';
    mandatoryReasons.push('Critical transaction frequency (6+ in 1 min)');
    mandatoryCodes.push('CRITICAL_FREQUENCY');
  } else if (freqCount >= 4) {
    if (mandatoryStatus !== 'blocked') mandatoryStatus = 'flagged';
    mandatoryReasons.push('High transaction frequency (4-5 in 1 min)');
    mandatoryCodes.push('HIGH_FREQUENCY');
  }
  // --- 🚨 MANDATORY HARD RULES END ---

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
  const reasons = [...mandatoryReasons];
  const reasonCodes = [...mandatoryCodes];
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

  let recommendedStatus = mandatoryStatus;
  const shouldBlock =
    recommendedStatus === 'blocked' ||
    strongestAction === 'block' ||
    actionQueue.includes('block') ||
    (riskScorePercent >= 80 &&
      (highAmount || foreignLocation || impossibleTravel));
  const shouldNotify =
    recommendedStatus === 'flagged' ||
    strongestAction === 'flag' ||
    strongestAction === 'review' ||
    actionQueue.includes('notify') ||
    riskScorePercent >= 45;

  if (shouldBlock) {
    recommendedStatus = 'blocked';
  } else if (shouldNotify) {
    recommendedStatus = 'flagged';
  }

  // ML prediction
  let mlResult = null;
  try {
    mlResult = predict({
      amount: normalizedAmount,
      type: transactionType,
      status: recommendedStatus,
      createdAt: now,
      riskScore: riskScore,
    });
  } catch (_) {}

  // Combine ML + Rules
  if (mlResult && mlResult.fraudProbability > 70 && recommendedStatus === 'approved') {
    recommendedStatus = 'flagged';
    reasons.push('ML model detected suspicious pattern');
    reasonCodes.push('ML_FRAUD_DETECTED');
  }
  if (mlResult && mlResult.fraudProbability > 88 && recommendedStatus !== 'blocked') {
    recommendedStatus = 'blocked';
    reasons.push('ML model high confidence fraud');
    reasonCodes.push('ML_HIGH_CONFIDENCE_FRAUD');
  }

  const finalRiskScore = mlResult
    ? clamp(Number(((riskScore + mlResult.fraudProbability / 100) / 2).toFixed(4)), 0.01, 0.99)
    : riskScore;
  const finalRiskScorePercent = Math.round(finalRiskScore * 100);
  const finalRiskLevel = toRiskLevel(finalRiskScorePercent);

  return {
    riskScore: finalRiskScore,
    riskScorePercent: finalRiskScorePercent,
    riskLevel: finalRiskLevel,
    recommendedStatus,
    reasons,
    reasonCodes: Array.from(new Set([...reasonCodes, ...triggeredRules.map((rule) => rule.reasonCode)])),
    metrics,
    triggeredRules,
    mlScore: mlResult ? mlResult.fraudProbability : null,
    modelSummary: {
      engine: 'FraudGuard Hybrid Engine',
      mode: activeRules.length ? 'rules-plus-heuristics-plus-ml' : 'heuristics-plus-ml',
      evaluatedRules: activeRules.length,
      mlEnabled: mlResult !== null,
    },
  };
};
