const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
