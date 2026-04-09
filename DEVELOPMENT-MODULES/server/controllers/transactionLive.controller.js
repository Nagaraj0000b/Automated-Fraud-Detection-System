const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createAuditLog } = require('./audit.controller');
const { createNotification } = require('./notification.controller');
const { scoreTransaction } = require('../services/fraudEngine');
const connectDB = require('../config/database');
const mongoose = require('mongoose');
const {
  ensureUser,
  addTransaction,
  getTransactions,
  updateTransaction,
} = require('../services/demoStore');

const TEST_TOP_UP_BALANCE = 1000000;
const ALLOWED_TRANSACTION_TYPES = ['deposit', 'withdrawal', 'transfer', 'payment'];

const isInternalTestUser = (req, user) =>
  ['admin', 'analyst'].includes(req.user?.role);
const resolveSessionUserId = (req) => req.user?.userId || req.user?.id || '';
const isDemoSession = (req) => {
  const sessionUserId = resolveSessionUserId(req);
  return (
    !sessionUserId ||
    !mongoose.Types.ObjectId.isValid(sessionUserId)
  );
};

const normalizeText = (value = '') => String(value || '').trim();
const normalizeTransactionType = (value = 'transfer') => String(value || 'transfer').trim().toLowerCase();
const deriveRiskLevel = (riskScore = 0) => {
  if (riskScore >= 0.85) return 'CRITICAL_RISK';
  if (riskScore >= 0.7) return 'HIGH_RISK';
  if (riskScore >= 0.45) return 'MEDIUM_RISK';
  return 'LOW_RISK';
};
const transactionToDto = (transaction) => {
  if (!transaction) return null;

  const rawUser = transaction.userDetails || transaction.user || null;
  const user =
    rawUser && typeof rawUser === 'object'
      ? {
          id: String(rawUser._id || rawUser.id || ''),
          name: rawUser.name || 'Unknown User',
          email: rawUser.email || '',
        }
      : null;

  const riskScore = Number(transaction.riskScore || 0);

  return {
    id: String(transaction._id),
    _id: String(transaction._id),
    accountId: transaction.accountId || '',
    amount: Number(transaction.amount || 0),
    transactionType: transaction.transactionType || 'transfer',
    recipient: transaction.recipient || '',
    description: transaction.description || '',
    location: transaction.location || '',
    status: transaction.status || 'pending',
    disputeStatus: transaction.disputeStatus || 'none',
    disputeReason: transaction.disputeReason || '',
    riskScore,
    riskScorePercent:
      transaction.riskScorePercent !== undefined
        ? Number(transaction.riskScorePercent || 0)
        : Math.round(riskScore * 100),
    riskLevel: transaction.riskLevel || deriveRiskLevel(riskScore),
    reasonCodes: Array.isArray(transaction.reasonCodes) ? transaction.reasonCodes : [],
    triggeredRules: Array.isArray(transaction.triggeredRules) ? transaction.triggeredRules : [],
    createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
    user,
  };
};

const topUpTestBalanceIfNeeded = async ({ req, user, accountId, amountNumber, isOffline }) => {
  const sourceAccount = accountId
    ? user.accounts.find((account) => account.accountId === accountId)
    : null;
  const availableBalance = sourceAccount ? sourceAccount.balance : user.accountBalance;

  if (availableBalance >= amountNumber || !isInternalTestUser(req, user)) {
    return { sourceAccount, availableBalance };
  }

  if (isOffline) {
    if (sourceAccount) sourceAccount.balance = TEST_TOP_UP_BALANCE;
    else user.accountBalance = TEST_TOP_UP_BALANCE;
  } else if (sourceAccount) {
    sourceAccount.balance = TEST_TOP_UP_BALANCE;
    await user.save();
  } else {
    user.accountBalance = TEST_TOP_UP_BALANCE;
    await user.save();
  }

  return {
    sourceAccount: accountId ? user.accounts.find((account) => account.accountId === accountId) : null,
    availableBalance: TEST_TOP_UP_BALANCE,
  };
};

exports.getUserTransactions = async (req, res) => {
  try {
    const { accountId } = req.query;
    const sessionUserId = resolveSessionUserId(req);

    if (!connectDB.isConnected() || isDemoSession(req)) {
      const transactions = getTransactions()
        .filter((item) => item.user === sessionUserId && (!accountId || item.accountId === accountId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50)
        .map(transactionToDto);

      return res.json(transactions);
    }

    const filter = { user: sessionUserId };
    if (accountId) {
      filter.accountId = accountId;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(transactions.map(transactionToDto));
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 50, page = 1, status, search } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (!connectDB.isConnected()) {
      let transactions = getTransactions().map((item) => ({
        ...item,
        user: item.userDetails || null,
      }));

      if (status) {
        transactions = transactions.filter((item) => item.status === status);
      }

      if (search) {
        const q = search.toLowerCase();
        transactions = transactions.filter(
          (item) =>
            item.recipient?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.user?.email?.toLowerCase().includes(q) ||
            item.user?.name?.toLowerCase().includes(q)
        );
      }

      const total = transactions.length;
      const paginated = transactions
        .slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit)
        .map(transactionToDto);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit) || 1,
        transactions: paginated,
      });
    }

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      transactions: transactions.map(transactionToDto),
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'flagged', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (!connectDB.isConnected()) {
      const transaction = updateTransaction(transactionId, { status });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      await createNotification({
        user: transaction.user,
        relatedTransaction: transaction._id,
        type: status === 'blocked' ? 'error' : status === 'flagged' ? 'warning' : 'success',
        title: `Transaction ${status}`,
        message: `Your transaction to ${transaction.recipient} is now marked as ${status}.`,
      });

      return res.status(200).json({ success: true, transaction: transactionToDto(transaction), message: `Status updated to ${status}` });
    }

    const transaction = await Transaction.findById(transactionId).populate('user', 'name email');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    await transaction.save();

    await createNotification({
      user: transaction.user._id,
      relatedTransaction: transaction._id,
      type: status === 'blocked' ? 'error' : status === 'flagged' ? 'warning' : 'success',
      title: `Transaction ${status}`,
      message: `Your transaction to ${transaction.recipient} is now marked as ${status}.`,
    });

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
        summary: `Transaction status manually reviewed and set to ${status}`,
      },
      result: 'Success',
    });

    res.status(200).json({ success: true, transaction: transactionToDto(transaction), message: `Status updated from ${oldStatus} to ${status}` });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { amount, transactionType, recipient, description, accountId, location } = req.body;
    const amountNumber = Number(amount);
    const normalizedTransactionType = normalizeTransactionType(transactionType);
    const normalizedRecipient = normalizeText(recipient);
    const normalizedDescription = normalizeText(description);
    const normalizedLocation = normalizeText(location);
    const sessionUserId = resolveSessionUserId(req);

    if (!amountNumber || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (!ALLOWED_TRANSACTION_TYPES.includes(normalizedTransactionType)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    if (!normalizedRecipient) {
      return res.status(400).json({ success: false, message: 'Recipient is required' });
    }

    if (!normalizedLocation) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }

    const isOffline = !connectDB.isConnected() || isDemoSession(req);
    const user = isOffline
      ? ensureUser(req.user)
      : await User.findById(sessionUserId).select('name email accounts accountBalance');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { availableBalance } = await topUpTestBalanceIfNeeded({
      req,
      user,
      accountId,
      amountNumber,
      isOffline,
    });

    if (availableBalance < amountNumber) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const fraudDecision = await scoreTransaction({
      userId: sessionUserId,
      amount: amountNumber,
      transactionType: normalizedTransactionType,
      recipient: normalizedRecipient,
      description: normalizedDescription,
      location: normalizedLocation,
    });

    const status = fraudDecision.recommendedStatus;
    const riskScore = fraudDecision.riskScore;

    const newTransaction = isOffline
      ? addTransaction({
          user: sessionUserId,
          userDetails: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          accountId: accountId || undefined,
          amount: amountNumber,
          transactionType: normalizedTransactionType,
          recipient: normalizedRecipient,
          description: normalizedDescription,
          location: normalizedLocation,
          status,
          riskScore,
          riskScorePercent: fraudDecision.riskScorePercent,
          riskLevel: fraudDecision.riskLevel,
          reasonCodes: fraudDecision.reasonCodes,
          triggeredRules: fraudDecision.triggeredRules.map((rule) => rule.name),
        })
      : await Transaction.create({
          user: sessionUserId,
          accountId: accountId || undefined,
          amount: amountNumber,
          transactionType: normalizedTransactionType,
          recipient: normalizedRecipient,
          description: normalizedDescription,
          location: normalizedLocation,
          status,
          riskScore,
          riskScorePercent: fraudDecision.riskScorePercent,
          riskLevel: fraudDecision.riskLevel,
          reasonCodes: fraudDecision.reasonCodes,
          triggeredRules: fraudDecision.triggeredRules.map((rule) => rule.name),
        });

    if (status !== 'blocked') {
      if (isOffline) {
        if (accountId) {
          const targetAccount = user.accounts.find((account) => account.accountId === accountId);
          if (targetAccount) targetAccount.balance -= amountNumber;
        } else {
          user.accountBalance -= amountNumber;
        }
      } else if (accountId) {
        await User.updateOne(
          { _id: sessionUserId, 'accounts.accountId': accountId },
          { $inc: { 'accounts.$.balance': -amountNumber } }
        );
      } else {
        await User.findByIdAndUpdate(sessionUserId, { $inc: { accountBalance: -amountNumber } });
      }
    }

    const decisionLabel =
      status === 'blocked'
        ? 'blocked by fraud engine'
        : status === 'flagged'
          ? 'flagged for analyst review'
          : 'approved by fraud engine';

    await createNotification({
      user: sessionUserId,
      relatedTransaction: newTransaction._id,
      type: status === 'blocked' ? 'error' : status === 'flagged' ? 'warning' : 'success',
      title: `Transaction ${status}`,
      message: `Your payment to ${normalizedRecipient} for Rs. ${amountNumber.toLocaleString('en-IN')} was ${decisionLabel}.`,
    });

    await createAuditLog({
      action: 'Transaction Auto Decision',
      actor: req.user.userId || req.user.id || 'system',
      actorName: user.name || req.user.name || 'User',
      target: `TxID: ${newTransaction._id}`,
      ipAddress: req.ip,
      details: {
        status,
        riskScore,
        riskScorePercent: fraudDecision.riskScorePercent,
        riskLevel: fraudDecision.riskLevel,
        reasonCodes: fraudDecision.reasonCodes,
        reasons: fraudDecision.reasons,
        triggeredRules: fraudDecision.triggeredRules,
        modelSummary: fraudDecision.modelSummary,
      },
      result: 'Success',
    });

    res.status(201).json({
      success: true,
      transaction: transactionToDto(newTransaction),
      decision: {
        status,
        riskScore,
        riskScorePercent: fraudDecision.riskScorePercent,
        riskLevel: fraudDecision.riskLevel,
        reasonCodes: fraudDecision.reasonCodes,
        reasons: fraudDecision.reasons,
        triggeredRules: fraudDecision.triggeredRules,
        modelSummary: fraudDecision.modelSummary,
      },
      message:
        status === 'blocked'
          ? 'Transaction blocked by fraud engine.'
          : status === 'flagged'
            ? 'Transaction submitted and flagged for review.'
            : 'Transaction approved successfully.',
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Transaction failed', error: error.message });
  }
};

exports.raiseDispute = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!connectDB.isConnected() || isDemoSession(req)) {
      const userId = resolveSessionUserId(req);
      const transaction = getTransactions().find((item) => item._id === transactionId && item.user === userId);

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found or access denied' });
      }

      if (transaction.disputeStatus && transaction.disputeStatus !== 'none') {
        return res.status(400).json({ message: 'Dispute already raised for this transaction' });
      }

      transaction.disputeStatus = 'open';
      transaction.disputeReason = reason;

      await createNotification({
        user: userId,
        relatedTransaction: transaction._id,
        type: 'warning',
        title: 'Dispute raised',
        message: `We received your dispute for ${transaction.recipient}. Our analyst team will review it.`,
      });

      return res.json({ message: 'Dispute raised successfully. Our team will review it shortly.', transaction: transactionToDto(transaction) });
    }

    const transaction = await Transaction.findOne({ _id: transactionId, user: resolveSessionUserId(req) });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or access denied' });
    }

    if (transaction.disputeStatus && transaction.disputeStatus !== 'none') {
      return res.status(400).json({ message: 'Dispute already raised for this transaction' });
    }

    transaction.disputeStatus = 'open';
    transaction.disputeReason = reason;
    await transaction.save();

    await createNotification({
      user: resolveSessionUserId(req),
      relatedTransaction: transaction._id,
      type: 'warning',
      title: 'Dispute raised',
      message: `We received your dispute for ${transaction.recipient}. Our analyst team will review it.`,
    });

    res.json({ message: 'Dispute raised successfully. Our team will review it shortly.', transaction: transactionToDto(transaction) });
  } catch (error) {
    console.error('Dispute Error:', error);
    res.status(500).json({ message: 'Failed to raise dispute', error: error.message });
  }
};
