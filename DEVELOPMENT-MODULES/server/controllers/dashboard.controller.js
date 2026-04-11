const User = require('../models/User');
const Transaction = require('../models/Transaction');
const RiskRule = require('../models/RiskRule');

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_RISK_THRESHOLD = 0.5;

const percentChange = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - DAY_MS);
    const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);

    const [
      totalUsers,
      activeUsers,
      adminCount,
      analystCount,
      recentUsers,
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
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'analyst' }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
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
    ]);

    const approvedTransactions = allTransactions.filter(
      (transaction) => transaction.status === 'approved'
    ).length;
    const totalAmount24h = allTransactions
      .filter((transaction) => transaction.createdAt >= oneDayAgo)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const avgRiskScore = allTransactions.length
      ? Number(
          (
            allTransactions.reduce(
              (sum, transaction) => sum + Number(transaction.riskScore || 0),
              0
            ) / allTransactions.length
          ).toFixed(4)
        )
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminCount,
          analysts: analystCount,
          recentSignups: recentUsers,
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
          activeModels: null,
          avgAccuracy: null,
        },
        riskRules: {
          totalRules,
          activeRules,
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
    const recentUsers = await User.find()
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
