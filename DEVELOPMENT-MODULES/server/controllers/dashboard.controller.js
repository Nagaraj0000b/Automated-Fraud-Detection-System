const User = require('../models/User');
const Transaction = require('../models/Transaction');
const connectDB = require('../config/database');
const { getTransactions, getAllUsers } = require('../services/demoStore');

// GET /api/dashboard/stats — Aggregate overview stats
exports.getStats = async (req, res) => {
    try {
        const isOffline = !connectDB.isConnected();

        let totalUsers, usersByRole, usersByStatus, activeUsers, adminCount, recentUsers;
        let totalTxns24h = 0, flaggedFrauds = 0, approvalRate = '0%';

        if (isOffline) {
            const users = getAllUsers();
            totalUsers = users.length;
            activeUsers = users.filter(u => u.status === 'active').length;
            adminCount = users.filter(u => u.role === 'admin').length;
            recentUsers = users.length; // Simplified for demo
            
            // Mock role grouping
            const roles = {};
            users.forEach(u => roles[u.role] = (roles[u.role] || 0) + 1);
            usersByRole = Object.keys(roles).map(role => ({ _id: role, count: roles[role] }));

            const statuses = {};
            users.forEach(u => statuses[u.status] = (statuses[u.status] || 0) + 1);
            usersByStatus = Object.keys(statuses).map(status => ({ _id: status, count: statuses[status] }));

            // Transaction stats
            const txns = getTransactions();
            totalTxns24h = txns.length;
            flaggedFrauds = txns.filter(t => t.status === 'flagged' || t.status === 'blocked').length;
            const approved = txns.filter(t => t.status === 'approved').length;
            approvalRate = txns.length ? Math.round((approved / txns.length) * 100) + '%' : '100%';
        } else {
            [totalUsers, usersByRole, usersByStatus, activeUsers, adminCount] = await Promise.all([
                User.countDocuments(),
                User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
                User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                User.countDocuments({ status: 'active' }),
                User.countDocuments({ role: 'admin' })
            ]);

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

            // Real transaction stats
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            totalTxns24h = await Transaction.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
            flaggedFrauds = await Transaction.countDocuments({ 
                status: { $in: ['flagged', 'blocked'] },
                createdAt: { $gte: twentyFourHoursAgo }
            });
            const approved = await Transaction.countDocuments({ status: 'approved' });
            const totalAll = await Transaction.countDocuments();
            approvalRate = totalAll ? Math.round((approved / totalAll) * 100) + '%' : '100%';
        }

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
                total24h: totalTxns24h,
                flaggedFrauds: flaggedFrauds,
                approvalRate: approvalRate,
            },
            models: {
                activeModels: 1,
                avgAccuracy: '96.7%',
            },
            riskRules: {
                totalRules: 12,
                activeRules: 8,
            }
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/dashboard/recent-users — Get recently joined users for the dashboard
exports.getRecentUsers = async (req, res) => {
    try {
        if (!connectDB.isConnected()) {
            return res.status(200).json({ success: true, users: getAllUsers().slice(0, 5) });
        }
        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({ success: true, users: recentUsers });
    } catch (error) {
        console.error('Recent users error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
