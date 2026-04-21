const Transaction = require('../models/Transaction');
const connectDB = require('../config/database');
const { getTransactions } = require('../services/demoStore');

const HIGH_RISK_THRESHOLD = 0.5;
const RECENT_ALERT_WINDOW_MS = 4 * 60 * 60 * 1000;

const getRiskLevel = (score = 0) => {
  if (score >= 0.85) return 'Critical';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
};

const mapStoredRiskLevel = (value = '') => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'CRITICAL_RISK') return 'Critical';
  if (normalized === 'HIGH_RISK') return 'High';
  if (normalized === 'MEDIUM_RISK') return 'Medium';
  if (normalized === 'LOW_RISK') return 'Low';
  return '';
};

const getAlertStatus = (transactionStatus) => {
  if (transactionStatus === 'blocked') return 'resolved';
  if (transactionStatus === 'approved') return 'false_positive';
  if (transactionStatus === 'pending') return 'reviewed';
  return 'open';
};

const getAlertType = (transaction) => {
  if (transaction.amount >= 100000) return 'Large Amount Spike';
  if (transaction.amount >= 50000) return 'High Value Transfer';
  if (transaction.location) return 'Location Anomaly';
  if (transaction.transactionType === 'payment') return 'Payment Pattern';
  if (transaction.transactionType === 'transfer') return 'Transfer Velocity';
  return 'Suspicious Activity';
};

const buildAlert = (transaction) => ({
  _id: transaction._id,
  alertId: `FA-${String(transaction._id).slice(-6).toUpperCase()}`,
  transactionId: transaction._id,
  amount: transaction.amount,
  createdAt: transaction.createdAt,
  transactionType: transaction.transactionType,
  transactionStatus: transaction.status,
  location: transaction.location || 'Unknown',
  type: getAlertType(transaction),
  status: getAlertStatus(transaction.status),
  riskScore:
    transaction.riskScorePercent !== undefined
      ? Math.round(transaction.riskScorePercent)
      : Math.round((transaction.riskScore || 0) * 100),
  riskLevel: mapStoredRiskLevel(transaction.riskLevel) || getRiskLevel(transaction.riskScore || 0),
  user: transaction.user
    ? {
        _id: transaction.user._id,
        name: transaction.user.name,
        email: transaction.user.email,
      }
    : null,
});

const buildQuery = ({ status, riskLevel }) => {
  const query = {
    status: { $in: ['flagged', 'blocked'] },
  };

  if (status) {
    if (status === 'open') {
      query.status = 'flagged';
    } else if (status === 'resolved') {
      query.status = 'blocked';
    } else if (status === 'false_positive') {
      query.status = 'approved';
    } else if (status === 'reviewed') {
      query.status = 'pending';
    }
  }

  if (riskLevel) {
    if (riskLevel === 'Critical') {
      query.riskScore = { $gte: 0.85 };
    } else if (riskLevel === 'High') {
      query.riskScore = { $gte: 0.7, $lt: 0.85 };
    } else if (riskLevel === 'Medium') {
      query.riskScore = { $gte: 0.5, $lt: 0.7 };
    } else if (riskLevel === 'Low') {
      query.riskScore = { $lt: 0.5 };
    }
  }

  return query;
};

exports.getAlerts = async (req, res) => {
  try {
    const { status, riskLevel, limit = 20, page = 1 } = req.query;
    const query = buildQuery({ status, riskLevel });
    const parsedLimit = Number(limit) || 20;
    const parsedPage = Number(page) || 1;

    if (!connectDB.isConnected()) {
      let alerts = getTransactions()
        .filter((txn) => txn.status === 'flagged' || txn.status === 'blocked')
        .map((txn) => buildAlert({ ...txn, user: txn.userDetails || null }));

      if (status) {
        alerts = alerts.filter((item) => item.status === status);
      }
      if (riskLevel) {
        alerts = alerts.filter((item) => item.riskLevel === riskLevel);
      }

      const total = alerts.length;
      const paginated = alerts.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

      return res.status(200).json({
        success: true,
        alerts: paginated,
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit) || 1,
      });
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      alerts: transactions.map(buildAlert),
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load alerts' });
  }
};

exports.getRecentAlerts = async (req, res) => {
  try {
    const recentSince = new Date(Date.now() - RECENT_ALERT_WINDOW_MS);

    if (!connectDB.isConnected()) {
      const alerts = getTransactions()
        .filter((txn) => new Date(txn.createdAt) >= recentSince)
        .filter((txn) => txn.status === 'flagged' || txn.status === 'blocked')
        .slice(0, 10)
        .map((txn) => buildAlert({ ...txn, user: txn.userDetails || null }));

      return res.status(200).json({
        success: true,
        alerts,
      });
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: recentSince },
      status: { $in: ['flagged', 'blocked'] },
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      alerts: transactions.map(buildAlert),
    });
  } catch (error) {
    console.error('Get recent alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load recent alerts' });
  }
};

exports.getAlertStats = async (req, res) => {
  try {
    if (!connectDB.isConnected()) {
      const allAlerts = getTransactions().filter(
        (txn) => txn.status === 'flagged' || txn.status === 'blocked' || (txn.riskScore || 0) >= HIGH_RISK_THRESHOLD
      );
      const averageRisk = allAlerts.length
        ? Number((allAlerts.reduce((sum, alert) => sum + (alert.riskScore || 0), 0) / allAlerts.length).toFixed(4))
        : 0;
      const byLevel = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      };

      allAlerts.forEach((alert) => {
        byLevel[getRiskLevel(alert.riskScore || 0)] += 1;
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalFraudDetected: allAlerts.length,
          avgRiskScore: Math.round(averageRisk * 100),
          weekChange: 0,
          byLevel,
        },
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const query = {
      status: { $in: ['flagged', 'blocked'] },
    };

    const [currentAlerts, previousAlerts, allAlerts] = await Promise.all([
      Transaction.find({ ...query, createdAt: { $gte: sevenDaysAgo } }).select('riskScore riskLevel riskScorePercent'),
      Transaction.find({ ...query, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }).select('riskScore riskLevel riskScorePercent'),
      Transaction.find(query).select('riskScore riskLevel riskScorePercent'),
    ]);

    const averageRisk = allAlerts.length
      ? Number(
          (
            allAlerts.reduce((sum, alert) => sum + (alert.riskScore || 0), 0) / allAlerts.length
          ).toFixed(4)
        )
      : 0;

    const byLevel = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    allAlerts.forEach((alert) => {
      byLevel[getRiskLevel(alert.riskScore || 0)] += 1;
    });

    const weekChange = previousAlerts.length
      ? Number((((currentAlerts.length - previousAlerts.length) / previousAlerts.length) * 100).toFixed(1))
      : currentAlerts.length > 0
        ? 100
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalFraudDetected: allAlerts.length,
        avgRiskScore: Math.round(averageRisk * 100),
        weekChange,
        byLevel,
      },
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load alert stats' });
  }
};
