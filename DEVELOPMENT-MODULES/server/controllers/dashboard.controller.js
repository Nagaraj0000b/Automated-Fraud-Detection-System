const User = require('../models/User');

// GET /api/dashboard/stats — Aggregate overview stats
exports.getStats = async (req, res) => {
    try {
        // Total users
        const totalUsers = await User.countDocuments();

        // Users by role
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Users by status
        const usersByStatus = await User.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Active users (status === 'active')
        const activeUsers = await User.countDocuments({ status: 'active' });

        // Admin count
        const adminCount = await User.countDocuments({ role: 'admin' });

        // Recently created users (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Placeholder stats for future modules (transactions, models, etc.)
        // These will be replaced with real data once those models are built
        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                admins: adminCount,
                recentSignups: recentUsers,
                byRole: usersByRole,
                byStatus: usersByStatus
            },
            transactions: {
                total24h: 0,
                flaggedFrauds: 0,
                approvalRate: '0%',
                note: 'Transaction model not yet built'
            },
            models: {
                activeModels: 0,
                avgAccuracy: '0%',
                note: 'AI Model module not yet built'
            },
            riskRules: {
                totalRules: 0,
                activeRules: 0,
                note: 'Risk Rules module not yet built'
            }
        };

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/dashboard/recent-users — Get recently joined users for the dashboard
exports.getRecentUsers = async (req, res) => {
    try {
        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            users: recentUsers
        });
    } catch (error) {
        console.error('Recent users error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
