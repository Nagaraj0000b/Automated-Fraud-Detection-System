const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createAuditLog } = require('./audit.controller');
const { createNotification } = require('./notification.controller');
const { scoreTransaction } = require('../services/fraudEngine');

// Get all transactions for the current user (optionally filtered by account)
exports.getUserTransactions = async (req, res) => {
  try {
    const { accountId } = req.query;
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'User identity not found in token' });
    }

    const filter = { user: userId };
    if (accountId) {
      filter.accountId = accountId;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
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
    const { amount: rawAmount, transactionType, recipient, description, accountId, location } = req.body;
    const amount = Number(rawAmount);
    const userId = req.user.userId || req.user.id;
    const currentIp = req.ip || '0.0.0.0';
    
    console.log(`[FraudCheck] Processing Txn: Amount=${amount}, User=${userId}, Location=${location}`);

    const fraudDecision = await scoreTransaction({
      userId,
      amount,
      transactionType,
      recipient,
      description,
      location,
    });

    const status = fraudDecision.recommendedStatus;
    const riskScore = fraudDecision.riskScore;

    const newTransaction = new Transaction({
      user: userId,
      accountId: accountId || undefined,
      amount,
      transactionType,
      recipient,
      description,
      location,
      ipAddress: currentIp,
      status,
      riskScore,
      reasonCodes: fraudDecision.reasonCodes,
      reasons: fraudDecision.reasons,
      triggeredRules: fraudDecision.triggeredRules.map(r => typeof r === 'string' ? r : r.name),
    });
    
    await newTransaction.save();
    
    if (status === 'blocked') {
      await User.findByIdAndUpdate(userId, { status: 'suspended' });
      await createAuditLog({
        action: 'Automatic Account Suspension',
        actor: 'System AI',
        actorName: 'FraudGuard AI',
        target: `User: ${req.user.email || 'Unknown'}`,
        ipAddress: req.ip,
        details: { 
          reason: fraudDecision.reasons.join(' & '),
          transactionId: newTransaction._id,
          riskScore: riskScore,
          amount: amount
        },
        result: 'Success'
      });
    }

    if (status !== 'blocked') {
      if (accountId) {
        await User.updateOne(
          { _id: userId, 'accounts.accountId': accountId },
          { $inc: { 'accounts.$.balance': -amount } }
        );
      } else {
        await User.findByIdAndUpdate(userId, { $inc: { accountBalance: -amount } });
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: 'Transaction failed', error: error.message });
  }
};


      const curr = parseLoc(location);
      const last = parseLoc(lastTx.location);

      // Rule 3: Location Anomaly
      if (curr.country && last.country && curr.country !== last.country) {
        triggeredRules.push('DIFFERENT_COUNTRY');
        status = 'blocked';
        riskScore = 0.99;
      } else if (curr.country === 'unknown' && last.country && last.country !== 'unknown') {
        // Current is city, last is country -> treat as different country or flag?
        // User says "US" vs "delhi" should be block.
        triggeredRules.push('DIFFERENT_COUNTRY');
        status = 'blocked';
        riskScore = 0.99;
      } else if (curr.country && last.country === 'unknown' && curr.country !== 'unknown') {
        triggeredRules.push('DIFFERENT_COUNTRY');
        status = 'blocked';
        riskScore = 0.99;
      } else if (curr.city && last.city && curr.city !== last.city) {
        triggeredRules.push('CITY_CHANGE');
        if (status !== 'blocked') status = 'flagged';
        riskScore = Math.max(riskScore, 0.70);
      }

      // Rule 4: IP Address Check
      if (currentIp !== lastTx.ipAddress) {
        if (curr.country && last.country && curr.country !== last.country) {
          triggeredRules.push('IP_AND_COUNTRY_CHANGE');
          status = 'blocked';
          riskScore = 0.99;
        } else {
          triggeredRules.push('IP_CHANGE');
          if (status !== 'blocked') status = 'flagged';
          riskScore = Math.max(riskScore, 0.60);
        }
      }
    }

    // Rule 5: Transaction Frequency (Per Minute)
    const oneMinAgo = new Date(Date.now() - 60000);
    const freqCount = await Transaction.countDocuments({ user: userId, createdAt: { $gte: oneMinAgo } });
    if (freqCount >= 6) {
      triggeredRules.push('CRITICAL_FREQUENCY');
      status = 'blocked';
      riskScore = 0.99;
    } else if (freqCount >= 4) {
      triggeredRules.push('HIGH_FREQUENCY');
      if (status !== 'blocked') status = 'flagged';
      riskScore = Math.max(riskScore, 0.80);
    }

    const newTransaction = new Transaction({
      user: userId,
      accountId: accountId || undefined,
      amount,
      transactionType,
      recipient,
      description,
      location,
      ipAddress: currentIp,
      status,
      riskScore,
      reasonCodes: triggeredRules, // This was a bit mixed up in the original file, using the ones from fraudEngine now
      reasons: [], // We need to call fraudEngine here to get reasons
      triggeredRules: [],
    });
    
    await newTransaction.save();
    
    if (status === 'blocked') {
      await User.findByIdAndUpdate(userId, { status: 'suspended' });
      await createAuditLog({
        action: 'Automatic Account Suspension',
        actor: 'System AI',
        actorName: 'FraudGuard AI',
        target: `User: ${req.user.email || 'Unknown'}`,
        ipAddress: req.ip,
        details: { 
          reason: triggeredRules.join(' & '),
          transactionId: newTransaction._id,
          riskScore: riskScore,
          amount: amount
        },
        result: 'Success'
      });
    }

    if (status !== 'blocked') {
      if (accountId) {
        await User.updateOne(
          { _id: userId, 'accounts.accountId': accountId },
          { $inc: { 'accounts.$.balance': -amount } }
        );
      } else {
        await User.findByIdAndUpdate(userId, { $inc: { accountBalance: -amount } });
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
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
