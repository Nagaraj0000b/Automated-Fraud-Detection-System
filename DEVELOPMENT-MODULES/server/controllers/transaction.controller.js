const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createAuditLog } = require('./audit.controller');

// Get all transactions for the current user (optionally filtered by account)
exports.getUserTransactions = async (req, res) => {
  try {
    const { accountId } = req.query;

    const filter = { user: req.user.userId };
    if (accountId) {
      filter.accountId = accountId;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .limit(50);

    res.json(transactions);
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
};

// Get all transactions (Admin/Analyst only)
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 50, page = 1, status, search } = req.query;
    
    // Build query filter
    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        // Try searching by exact ID if it's a valid ObjectId length or just generic text
      ];
      // Note: searching by transaction ID or user needs special handling if they are ObjectIds,
      // for simple text search we check recipient and description.
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'name email') // get user details
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
};

// Update a transaction status (Admin/Analyst action)
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'flagged', 'blocked'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    await transaction.save();

    // Log the manual review action
    const actionLabel = status.charAt(0).toUpperCase() + status.slice(1);
    await createAuditLog({
      action: `Transaction ${actionLabel}`,
      actor: req.user.userId || req.user.id || 'system',
      actorName: req.user.name || 'Admin',
      target: `TxID: ${transactionId}`,
      ipAddress: req.ip,
      details: { 
          oldStatus, 
          newStatus: status,
          amount: transaction.amount,
          recipient: transaction.recipient,
          summary: `Transaction status manually reviewed and set to ${status}`
      },
      result: 'Success'
    });

    res.status(200).json({ success: true, transaction, message: `Status updated from ${oldStatus} to ${status}` });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new transaction (Simulate Payment)
exports.createTransaction = async (req, res) => {
  try {
    const { amount, transactionType, recipient, description, accountId, location } = req.body;
    
    // --- 🚨 BASIC FRAUD RULES (Temporary Logic) ---
    // If Amount > 50,000 OR Multiple small payments quickly (future logic)
    let riskScore = 0;
    let status = 'approved';

    if (amount > 100000) {
      status = 'blocked'; // Too risky! Auto-block
      riskScore = 0.99;
    } else if (amount > 50000) {
      status = 'flagged'; // Needs Analyst Review
      riskScore = 0.85;
    }

    const newTransaction = new Transaction({
      user: req.user.userId,
      accountId: accountId || undefined,
      amount,
      transactionType,
      recipient,
      description,
      location,
      status, // 'approved', 'flagged', or 'blocked'
      riskScore
    });
    
    await newTransaction.save();
    
    // Decrease User Balance ONLY if NOT BLOCKED
    if (status !== 'blocked') {
      if (accountId) {
        // Adjust specific account balance when accountId is provided
        await User.updateOne(
          { _id: req.user.userId, 'accounts.accountId': accountId },
          { $inc: { 'accounts.$.balance': -amount } }
        );
      } else {
        // Fallback: adjust legacy single accountBalance
        await User.findByIdAndUpdate(req.user.userId, { $inc: { accountBalance: -amount } });
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed', error: error.message });
  }
};

// Raise a Dispute for a specific transaction
exports.raiseDispute = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    // Verify the transaction belongs to the user
    const transaction = await Transaction.findOne({ _id: transactionId, user: req.user.userId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or access denied' });
    }

    if (transaction.disputeStatus && transaction.disputeStatus !== 'none') {
      return res.status(400).json({ message: 'Dispute already raised for this transaction' });
    }

    console.log(`[Dispute] Raising dispute for TxID: ${transactionId}. Reason: ${reason}`);

    transaction.disputeStatus = 'open';
    transaction.disputeReason = reason;
    await transaction.save();

    console.log(`[Dispute] Successfully saved dispute for TxID: ${transactionId}`);

    res.json({ message: 'Dispute raised successfully. Our team will review it shortly.', transaction });
  } catch (error) {
    console.error("Dispute Error:", error);
    res.status(500).json({ message: 'Failed to raise dispute', error: error.message });
  }
};
