const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ReactivationRequest = require('../models/ReactivationRequest');
const { createAuditLog } = require('./audit.controller');

// GET /api/users — List all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/users/:id — Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/users — Create a new user (admin creates users)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'user',
            department: department || 'General',
            status: 'active'
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// PUT /api/users/:id — Update a user (admin updates role, status, etc.)
exports.updateUser = async (req, res) => {
    try {
        const { name, role, status, department } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldStatus = user.status;

        if (name) user.name = name;
        if (role) user.role = role;
        if (status) user.status = status;
        if (department) user.department = department;

        await user.save();

        if (status && status !== oldStatus) {
            let actionName = 'User Status Update';
            if (status === 'suspended') actionName = 'Account Suspended';
            if (status === 'active' && oldStatus === 'suspended') actionName = 'Account Reactivated';

            await createAuditLog({
                action: actionName,
                actor: req.user.userId || req.user.id || 'system',
                actorName: req.user.name || 'Admin',
                target: `User: ${user.email}`,
                ipAddress: req.ip,
                details: { 
                    oldStatus, 
                    newStatus: status,
                    reason: status === 'suspended' ? 'Administrative suspension' : 'Access restored',
                    summary: `User account moved from ${oldStatus} to ${status}`
                },
                result: 'Success'
            });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// DELETE /api/users/:id — Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/users/reactivation-request — Create a reactivation request (Public)
exports.createReactivationRequest = async (req, res) => {
    try {
        const { email, reason } = req.body;

        if (!email || !reason) {
            return res.status(400).json({ success: false, message: 'Email and reason are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User with this email not found' });
        }

        if (user.status !== 'suspended') {
            return res.status(400).json({ success: false, message: 'Account is not suspended' });
        }

        // Check if there's already a pending request
        const existingRequest = await ReactivationRequest.findOne({ user: user._id, status: 'pending' });
        if (existingRequest) {
            return res.status(409).json({ success: false, message: 'You already have a pending reactivation request' });
        }

        const newRequest = new ReactivationRequest({
            user: user._id,
            email: email.toLowerCase(),
            reason
        });

        await newRequest.save();

        res.status(201).json({
            success: true,
            message: 'Reactivation request submitted successfully'
        });
    } catch (error) {
        console.error('Create reactivation request error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/users/reactivation-requests — List all requests (Admin only)
exports.getReactivationRequests = async (req, res) => {
    try {
        const requests = await ReactivationRequest.find()
            .populate('user', 'name email status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Get reactivation requests error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// PATCH /api/users/reactivation-requests/:id/status — Update request status (Admin only)
exports.updateReactivationRequestStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const requestId = req.params.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = await ReactivationRequest.findById(requestId).populate('user');
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        request.status = status;
        if (adminNotes) request.adminNotes = adminNotes;
        await request.save();

        // If approved, reactivate the user
        if (status === 'approved' && request.user) {
            const user = request.user;
            const oldStatus = user.status;
            user.status = 'active';
            await user.save();

            await createAuditLog({
                action: 'Account Reactivated',
                actor: req.user.userId || req.user.id || 'system',
                actorName: req.user.name || 'Admin',
                target: `User: ${user.email}`,
                ipAddress: req.ip,
                details: { 
                    oldStatus, 
                    newStatus: 'active',
                    reason: 'Reactivation request approved',
                    requestId,
                    summary: `User account reactivated after manual review of request`
                },
                result: 'Success'
            });
        }

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            request
        });
    } catch (error) {
        console.error('Update reactivation request error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
