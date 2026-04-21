const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const RiskRule = require('../models/RiskRule');
const connectDB = require('../config/database');
const { store } = require('../services/demoStore');
const { scoreTransaction } = require('../services/fraudEngine');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DEFAULT_BALANCE = 250000;

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const toPlain = (docs) => docs.map((doc) => JSON.parse(JSON.stringify(doc)));

const hasMeaningfulData = (backup = {}) =>
  (backup.transactions || []).length > 0 ||
  (backup.notifications || []).length > 0 ||
  (backup.rules || []).length > 0 ||
  (backup.users || []).length > 0;

const getLatestBackupFile = ({ preferNonEmpty = false } = {}) => {
  ensureBackupDir();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse();

  if (!preferNonEmpty) {
    return files.length ? path.join(BACKUP_DIR, files[0]) : '';
  }

  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    try {
      const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (hasMeaningfulData(backup)) {
        return filePath;
      }
    } catch (error) {
      console.error('Backup file read error:', error);
    }
  }

  return files.length ? path.join(BACKUP_DIR, files[0]) : '';
};

const buildBackupPayload = async () => {
  if (!connectDB.isConnected()) {
    return {
      mode: 'demo',
      users: Array.from(store.users.values()),
      transactions: store.transactions,
      notifications: store.notifications,
      rules: store.rules,
      models: store.models,
    };
  }

  const [users, transactions, notifications, rules] = await Promise.all([
    User.find().lean(),
    Transaction.find().lean(),
    Notification.find().lean(),
    RiskRule.find().lean(),
  ]);

  return {
    mode: 'mongodb',
    users,
    transactions,
    notifications,
    rules,
    models: store.models,
  };
};

const persistBackupToDisk = async ({ createdBy = 'system', filePrefix = 'backup' } = {}) => {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${filePrefix}-${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  const payload = await buildBackupPayload();

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        createdBy,
        ...payload,
      },
      null,
      2
    ),
    'utf8'
  );

  return { fileName, filePath };
};

exports.createBackup = async (req, res) => {
  try {
    const { fileName } = await persistBackupToDisk({
      createdBy: req.user?.email || req.user?.name || 'system',
      filePrefix: 'backup',
    });

    return res.status(201).json({
      success: true,
      message: 'Backup created successfully.',
      fileName,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create backup.' });
  }
};

exports.clearOperationalData = async (req, res) => {
  try {
    const safetyBackup = await persistBackupToDisk({
      createdBy: req.user?.email || req.user?.name || 'system',
      filePrefix: 'pre-clear-backup',
    });

    if (!connectDB.isConnected()) {
      store.transactions = [];
      store.notifications = [];
      store.rules = [];
      store.users.forEach((user) => {
        user.accountBalance = DEFAULT_BALANCE;
        user.accounts = (user.accounts || []).map((account) => ({
          ...account,
          balance: DEFAULT_BALANCE,
        }));
      });

      return res.status(200).json({
        success: true,
        message: `Demo data cleared successfully. Safety backup saved as ${safetyBackup.fileName}.`,
      });
    }

    await Promise.all([
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      RiskRule.deleteMany({}),
    ]);

    const users = await User.find();
    for (const user of users) {
      user.accountBalance = DEFAULT_BALANCE;
      user.status = 'active';
      user.accounts = (user.accounts || []).map((account) => ({
        ...account.toObject(),
        balance: DEFAULT_BALANCE,
      }));
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: `System transaction data cleared successfully. Safety backup saved as ${safetyBackup.fileName}.`,
    });
  } catch (error) {
    console.error('Clear data error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear data.' });
  }
};

exports.restoreLatestBackup = async (req, res) => {
  try {
    const latestBackupFile = getLatestBackupFile({ preferNonEmpty: true });
    if (!latestBackupFile) {
      return res.status(404).json({ success: false, message: 'No backup file found.' });
    }

    const backup = JSON.parse(fs.readFileSync(latestBackupFile, 'utf8'));

    if (!connectDB.isConnected()) {
      store.users = new Map((backup.users || []).map((user) => [user._id || user.id, user]));
      store.transactions = backup.transactions || [];
      store.notifications = backup.notifications || [];
      store.rules = backup.rules || [];
      store.models = backup.models || store.models;

      return res.status(200).json({
        success: true,
        message: 'Demo backup restored successfully.',
        fileName: path.basename(latestBackupFile),
      });
    }

    await Promise.all([
      Notification.deleteMany({}),
      Transaction.deleteMany({}),
      RiskRule.deleteMany({}),
      User.deleteMany({}),
    ]);

    if ((backup.users || []).length) {
      await User.insertMany(toPlain(backup.users), { ordered: false });
    }
    if ((backup.transactions || []).length) {
      await Transaction.insertMany(toPlain(backup.transactions), { ordered: false });
    }
    if ((backup.notifications || []).length) {
      await Notification.insertMany(toPlain(backup.notifications), { ordered: false });
    }
    if ((backup.rules || []).length) {
      await RiskRule.insertMany(toPlain(backup.rules), { ordered: false });
    }

    store.models = backup.models || store.models;

    return res.status(200).json({
      success: true,
      message: 'Latest backup restored successfully.',
      fileName: path.basename(latestBackupFile),
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to restore backup.' });
  }
};

exports.normalizeTransactions = async (req, res) => {
  try {
    if (!connectDB.isConnected()) {
      const groupedTransactions = new Map();
      const normalizedTransactions = [];

      [...store.transactions]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((transaction) => {
          const userId = transaction.user;
          const history = groupedTransactions.get(userId) || [];
          normalizedTransactions.push({ transaction, history });
          groupedTransactions.set(userId, [...history, transaction]);
        });

      for (const entry of normalizedTransactions) {
        const decision = await scoreTransaction({
          userId: entry.transaction.user,
          amount: entry.transaction.amount,
          transactionType: entry.transaction.transactionType,
          recipient: entry.transaction.recipient,
          description: entry.transaction.description,
          location: entry.transaction.location,
          recentTransactionsOverride: entry.history.slice(-20).reverse(),
          nowOverride: entry.transaction.createdAt,
        });

        entry.transaction.status = decision.recommendedStatus;
        entry.transaction.riskScore = decision.riskScore;
        entry.transaction.riskScorePercent = decision.riskScorePercent;
        entry.transaction.riskLevel = decision.riskLevel;
        entry.transaction.reasonCodes = decision.reasonCodes;
        entry.transaction.triggeredRules = decision.triggeredRules.map((rule) => rule.name);
      }

      return res.status(200).json({
        success: true,
        message: `Normalized ${normalizedTransactions.length} demo transactions.`,
      });
    }

    const transactions = await Transaction.find()
      .sort({ createdAt: 1 })
      .select('user amount transactionType recipient description location status riskScore riskScorePercent riskLevel reasonCodes triggeredRules createdAt');

    const historyByUser = new Map();
    let updatedCount = 0;

    for (const transaction of transactions) {
      const userId = String(transaction.user);
      const history = historyByUser.get(userId) || [];
      const decision = await scoreTransaction({
        userId,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        recipient: transaction.recipient,
        description: transaction.description,
        location: transaction.location,
        recentTransactionsOverride: history.slice(-20).reverse(),
        nowOverride: transaction.createdAt,
      });

      transaction.status = decision.recommendedStatus;
      transaction.riskScore = decision.riskScore;
      transaction.riskScorePercent = decision.riskScorePercent;
      transaction.riskLevel = decision.riskLevel;
      transaction.reasonCodes = decision.reasonCodes;
      transaction.triggeredRules = decision.triggeredRules.map((rule) => rule.name);
      await transaction.save();
      updatedCount += 1;

      historyByUser.set(userId, [
        ...history,
        {
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          location: transaction.location,
          status: transaction.status,
          transactionType: transaction.transactionType,
          recipient: transaction.recipient,
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      message: `Normalized ${updatedCount} transactions using current fraud rules.`,
    });
  } catch (error) {
    console.error('Normalize transactions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to normalize transactions.' });
  }
};

// ✅ NAYA — Transaction Approve
exports.approveTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!connectDB.isConnected()) {
      const tx = store.transactions.find((t) => t._id === id);
      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
      tx.status = 'approved';
      return res.status(200).json({ success: true, transaction: tx });
    }

    const tx = await Transaction.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    return res.status(200).json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Approve transaction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve transaction.' });
  }
};

// ✅ NAYA — Transaction Block
exports.blockTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!connectDB.isConnected()) {
      const tx = store.transactions.find((t) => t._id === id);
      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
      tx.status = 'blocked';
      return res.status(200).json({ success: true, transaction: tx });
    }

    const tx = await Transaction.findByIdAndUpdate(
      id,
      { status: 'blocked' },
      { new: true }
    );
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    return res.status(200).json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Block transaction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to block transaction.' });
  }
};