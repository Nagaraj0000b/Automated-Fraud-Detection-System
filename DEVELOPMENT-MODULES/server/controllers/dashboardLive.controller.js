const User = require('../models/User');
const Transaction = require('../models/Transaction');
const RiskRule = require('../models/RiskRule');
const connectDB = require('../config/database');
const { getAllUsers, getTransactions } = require('../services/demoStore');

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_RISK_THRESHOLD = 0.5;

const percentChange = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const buildDailyTrend = async (days) => {
  const trend = [];
  const now = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const dayStart = new Date(now.getTime() - index * DAY_MS);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [volume, flagged] = await Promise.all([
      Transaction.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd },
      }),
      Transaction.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd },
        $or: [
          { status: { $in: ['flagged', 'blocked'] } },
          { riskScore: { $gte: HIGH_RISK_THRESHOLD } },
        ],
      }),
    ]);

    trend.push({
      label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      volume,
      flagged,
    });
  }

  return trend;
};

exports.getStats = async (req, res) => {
  try {
    if (!connectDB.isConnected()) {
      const users = getAllUsers();
      const customerUsers = users.filter((user) => user.role === 'user');
      const transactions = getTransactions();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - DAY_MS);
      const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

      const totalTransactions24h = transactions.filter((txn) => new Date(txn.createdAt) >= oneDayAgo).length;
      const flaggedTransactions = transactions.filter((txn) => ['flagged', 'blocked'].includes(txn.status));
      const totalAmount24h = transactions
        .filter((txn) => new Date(txn.createdAt) >= oneDayAgo)
        .reduce((sum, txn) => sum + txn.amount, 0);
      const avgRiskScore = transactions.length
        ? Number((transactions.reduce((sum, txn) => sum + (txn.riskScore || 0), 0) / transactions.length).toFixed(4))
        : 0;

      return res.status(200).json({
        success: true,
        stats: {
          users: {
            total: customerUsers.length,
            active: customerUsers.filter((user) => user.status === 'active').length,
            admins: users.filter((user) => user.role === 'admin').length,
            analysts: users.filter((user) => user.role === 'analyst').length,
            recentSignups: customerUsers.filter((user) => new Date(user.createdAt) >= sevenDaysAgo).length,
            byRole: [],
            byStatus: [],
          },
          transactions: {
            total: transactions.length,
            total24h: totalTransactions24h,
            totalAmount24h: Number(totalAmount24h.toFixed(2)),
            flaggedFrauds: transactions.filter((txn) => txn.status === 'flagged').length,
            blockedFrauds: transactions.filter((txn) => txn.status === 'blocked').length,
            flagged24h: flaggedTransactions.filter((txn) => new Date(txn.createdAt) >= oneDayAgo).length,
            approvalRate: transactions.length
              ? Number(((transactions.filter((txn) => txn.status === 'approved').length / transactions.length) * 100).toFixed(1))
              : 0,
            avgRiskScore,
            dayChange: 0,
            fraudChange: 0,
          },
          alerts: {
            totalHighRisk: flaggedTransactions.length,
            weekChange: 0,
          },
          models: {
            activeModels: 1,
            avgAccuracy: transactions.length ? Number((100 - avgRiskScore * 35).toFixed(1)) : 96,
            riskCoverage: transactions.length
              ? Number(((flaggedTransactions.length / transactions.length) * 100).toFixed(1))
              : 0,
          },
          riskRules: {
            totalRules: 0,
            activeRules: 0,
          },
          trends: {
            week: [],
          },
        },
      });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - DAY_MS);
    const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);

    const [
      totalCustomerUsers,
      activeCustomerUsers,
      adminCount,
      analystCount,
      recentCustomerUsers,
      usersByRole,
      usersByStatus,
      totalTransactions,
      totalTransactions24h,
      previousTransactions24h,
      totalFlagged,
      totalBlocked,
      flagged24h,
      previousFlagged24h,
      highRiskAlerts,
      previousHighRiskAlerts,
      allTransactions,
      totalRules,
      activeRules,
      weeklyTrend,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', status: 'active' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'analyst' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Transaction.countDocuments(),
      Transaction.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Transaction.countDocuments({ createdAt: { $gte: twoDaysAgo, $lt: oneDayAgo } }),
      Transaction.countDocuments({ status: 'flagged' }),
      Transaction.countDocuments({ status: 'blocked' }),
      Transaction.countDocuments({
        createdAt: { $gte: oneDayAgo },
        status: { $in: ['flagged', 'blocked'] },
      }),
      Transaction.countDocuments({
        createdAt: { $gte: twoDaysAgo, $lt: oneDayAgo },
        status: { $in: ['flagged', 'blocked'] },
      }),
      Transaction.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        $or: [
          { status: { $in: ['flagged', 'blocked'] } },
          { riskScore: { $gte: HIGH_RISK_THRESHOLD } },
        ],
      }),
      Transaction.countDocuments({
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        $or: [
          { status: { $in: ['flagged', 'blocked'] } },
          { riskScore: { $gte: HIGH_RISK_THRESHOLD } },
        ],
      }),
      Transaction.find().select('amount riskScore status createdAt'),
      RiskRule.countDocuments(),
      RiskRule.countDocuments({ isActive: true }),
      buildDailyTrend(7),
    ]);

    const approvedTransactions = allTransactions.filter((txn) => txn.status === 'approved').length;
    const totalAmount24h = allTransactions
      .filter((txn) => txn.createdAt >= oneDayAgo)
      .reduce((sum, txn) => sum + txn.amount, 0);
    const avgRiskScore = allTransactions.length
      ? Number(
          (
            allTransactions.reduce((sum, txn) => sum + (txn.riskScore || 0), 0) /
            allTransactions.length
          ).toFixed(4)
        )
      : 0;
    const highRiskRate = totalTransactions
      ? Number((((totalFlagged + totalBlocked) / totalTransactions) * 100).toFixed(1))
      : 0;
    const modelAccuracy = totalTransactions
      ? Number((100 - Math.min(highRiskRate * 0.65, 99)).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalCustomerUsers,
          active: activeCustomerUsers,
          admins: adminCount,
          analysts: analystCount,
          recentSignups: recentCustomerUsers,
          byRole: usersByRole,
          byStatus: usersByStatus,
        },
        transactions: {
          total: totalTransactions,
          total24h: totalTransactions24h,
          totalAmount24h: Number(totalAmount24h.toFixed(2)),
          flaggedFrauds: totalFlagged,
          blockedFrauds: totalBlocked,
          flagged24h,
          approvalRate: totalTransactions
            ? Number(((approvedTransactions / totalTransactions) * 100).toFixed(1))
            : 0,
          avgRiskScore,
          dayChange: percentChange(totalTransactions24h, previousTransactions24h),
          fraudChange: percentChange(flagged24h, previousFlagged24h),
        },
        alerts: {
          totalHighRisk: highRiskAlerts,
          weekChange: percentChange(highRiskAlerts, previousHighRiskAlerts),
        },
        models: {
          activeModels: activeRules > 0 ? 1 : 0,
          avgAccuracy: modelAccuracy,
          riskCoverage: highRiskRate,
        },
        riskRules: {
          totalRules,
          activeRules,
        },
        trends: {
          week: weeklyTrend,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getRecentUsers = async (req, res) => {
  try {
    if (!connectDB.isConnected()) {
      return res.status(200).json({
        success: true,
        users: getAllUsers()
          .filter((user) => user.role === 'user')
          .slice(-5)
          .reverse(),
      });
    }

    const recentUsers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      users: recentUsers,
    });
  } catch (error) {
    console.error('Recent users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
