const { predict } = require('../ml/predict');
const RiskRule = require('../models/RiskRule');
const Transaction = require('../models/Transaction');
const connectDB = require('../config/database');
const { getTransactions, store } = require('./demoStore');

console.log('🚀 AI Engine v3.0 (Behavioral-Neural) Loaded successfully!');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normaliseLocation = (location = '') => String(location || '').trim().toLowerCase();
const normaliseText = (value = '') => String(value || '').trim();

const toRiskLevel = (scorePercent = 0) => {
  if (scorePercent >= 85) return 'CRITICAL_RISK';
  if (scorePercent >= 70) return 'HIGH_RISK';
  if (scorePercent >= 45) return 'MEDIUM_RISK';
  return 'LOW_RISK';
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
  const normalizedLocation = normaliseText(location);
  
  const recentTransactions = recentTransactionsOverride 
    ? recentTransactionsOverride 
    : (connectDB.isConnected()
        ? await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(100)
        : getTransactions().filter((txn) => txn.user === userId));

  const now = nowOverride ? new Date(nowOverride) : new Date();
  
  let riskProbability = 0.1; // Base risk
  const reasons = [];

  // 1. Spending Pattern Analysis
  if (recentTransactions.length > 0) {
    const historicalAmounts = recentTransactions.map(txn => Number(txn.amount || 0));
    const avgSpend = historicalAmounts.reduce((a, b) => a + b, 0) / historicalAmounts.length;
    const maxSpend = Math.max(...historicalAmounts);
    
    if (normalizedAmount > avgSpend * 20 && normalizedAmount > 10000) {
      riskProbability += 0.85;
      reasons.push('Transaction amount massively exceeds user average spending habit');
    } else if (normalizedAmount > avgSpend * 5 && normalizedAmount > 5000) {
      riskProbability += 0.4;
      reasons.push('Transaction amount significantly exceeds user average spending habit');
    } else if (normalizedAmount > maxSpend * 1.5 && normalizedAmount > 2000) {
      riskProbability += 0.2;
      reasons.push('Amount is unusually high compared to maximum previous transaction');
    }
  } else {
    if (normalizedAmount >= 100000) {
      riskProbability += 0.6;
      reasons.push('Extreme high value transaction detected');
    } else if (normalizedAmount > 10000) {
      riskProbability += 0.3;
      reasons.push('First-time high value transaction detected');
    }
  }

  // 2. Velocity Analysis (1-minute window)
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);
  const minuteTxns = recentTransactions.filter(txn => new Date(txn.createdAt) >= oneMinAgo);
  if (minuteTxns.length >= 3) {
    riskProbability += 0.85;
    reasons.push('Critical velocity spike: too many transactions within 1 minute');
  } else if (minuteTxns.length > 0) {
    riskProbability += 0.2;
    reasons.push('Increased transaction frequency detected');
  }

  // 3. Location Analysis
  const latestTxn = recentTransactions[0];
  const lastLocation = latestTxn?.location || '';
  const loc1 = normalizedLocation.toUpperCase();
  const domesticCities = ['MUMBAI', 'DELHI', 'BANGALORE', 'BANGLORE', 'CHENNAI', 'KOLKATA', 'PUNE'];
  const isForeign = !loc1.includes('IN') && !loc1.includes('INDIA') && !domesticCities.some(city => loc1.includes(city)) && loc1 !== '';

  if (normalizedLocation !== lastLocation && lastLocation !== '') {
    const loc2 = lastLocation.toUpperCase();
    const loc2IsForeign = !loc2.includes('IN') && !loc2.includes('INDIA') && !domesticCities.some(city => loc2.includes(city));
    
    if (isForeign || loc2IsForeign) {
      riskProbability += 0.85;
      reasons.push('Unusual cross-border location activity detected');
    } else {
      riskProbability += 0.15;
      reasons.push('Transaction location deviates from last known activity');
    }
  } else if (isForeign) {
    riskProbability += 0.85;
    reasons.push('Transaction from foreign location detected');
  }

  const behavioralScore = clamp(riskProbability, 0.01, 0.99);

  // 4. ML Integration
  let mlResult = null;
  try {
    mlResult = predict({
      amount: normalizedAmount,
      type: transactionType,
      createdAt: now,
      riskScore: behavioralScore,
    });
  } catch (_) {}

  // Calculate final score: Weighted average but behavioral score is dominant for spikes
  let finalRiskScore;
  if (mlResult) {
    const mlProb = mlResult.fraudProbability / 100;
    // If behavioral risk is extreme, don't let ML pull it down at all
    if (behavioralScore >= 0.8) {
      finalRiskScore = behavioralScore;
    } else if (behavioralScore >= 0.6) {
      finalRiskScore = clamp((behavioralScore * 0.7) + (mlProb * 0.3), 0.01, 0.99);
    } else {
      finalRiskScore = clamp((behavioralScore + mlProb) / 2, 0.01, 0.99);
    }
  } else {
    finalRiskScore = behavioralScore;
  }

  const riskScorePercent = Math.round(finalRiskScore * 100);

  // 5. Status Mapping
  let recommendedStatus = 'approved';
  if (finalRiskScore >= 0.8) {
    recommendedStatus = 'blocked';
  } else if (finalRiskScore >= 0.5) {
    recommendedStatus = 'flagged';
  } else {
    recommendedStatus = 'approved';
    if (reasons.length === 0) {
      reasons.push('Transaction matches user behavior patterns');
    }
  }

  // 6. Strict ML Override (Only for extreme confidence)
  if (mlResult && mlResult.fraudProbability > 98 && recommendedStatus !== 'blocked') {
    recommendedStatus = 'blocked';
    reasons.push('ML Model: Extreme high-confidence fraud detection');
  }

  return {
    riskScore: Number(finalRiskScore.toFixed(4)),
    riskScorePercent,
    riskLevel: toRiskLevel(riskScorePercent),
    recommendedStatus,
    reasons,
    reasonCodes: reasons.map(r => r.replace(/\s+/g, '_').toUpperCase()),
    metrics: { 
      amount: normalizedAmount, 
      aiProbability: finalRiskScore,
      behavioralMatch: finalRiskScore < 0.5 ? 'Strong' : 'Weak'
    },
    triggeredRules: [],
    modelSummary: {
      engine: 'Behavioral-Neural Ensemble v3.1',
      mode: 'Adaptive-Pattern-Recognition',
      mlEnabled: mlResult !== null
    }
  };
};
