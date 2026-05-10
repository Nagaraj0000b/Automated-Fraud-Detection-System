const mongoose = require('mongoose');
const User = require('../models/User');

// Previously this ensured a default "SecureBank" account.
// Default accounts are now disabled; users start with no accounts
// and explicitly add banks via the Add Account flow.
const ensureDefaultAccount = async (user) => {
  return user;
};

// GET /api/accounts/my-accounts - list accounts for logged-in user
exports.getMyAccounts = async (req, res) => {
  try {
    const connectDB = require('../config/database');
    if (!connectDB.isConnected()) {
      return res.status(200).json({
        success: true,
        accounts: [
          {
            accountId: `acc-${req.user.userId || req.user.id}`,
            bankName: 'SecureBank',
            accountNumber: `**** **** **** ${String(req.user.userId || req.user.id).slice(-4).toUpperCase()}`,
            balance: 10000,
          }
        ]
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      accounts: user.accounts || [],
    });
  } catch (error) {
    console.error('getMyAccounts error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/accounts - add a new bank account for logged-in user
exports.addAccount = async (req, res) => {
  try {
    const { bankName } = req.body;

    const connectDB = require('../config/database');
    if (!connectDB.isConnected()) {
      const newAccountId = `acc-${Date.now()}`;
      const randomLast4 = Math.floor(1000 + Math.random() * 9000);
      const newAccount = {
        accountId: newAccountId,
        bankName: bankName && bankName.trim() ? bankName.trim() : 'SecureBank',
        accountNumber: `**** **** **** ${randomLast4}`,
        balance: 1000,
      };
      return res.status(201).json({
        success: true,
        account: newAccount,
        accounts: [
          {
            accountId: `acc-${req.user.userId || req.user.id}`,
            bankName: 'SecureBank',
            accountNumber: `**** **** **** ${String(req.user.userId || req.user.id).slice(-4).toUpperCase()}`,
            balance: 10000,
          },
          newAccount
        ],
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newAccountId = new mongoose.Types.ObjectId().toString();
    const randomLast4 = Math.floor(1000 + Math.random() * 9000);

    const newAccount = {
      accountId: newAccountId,
      bankName: bankName && bankName.trim() ? bankName.trim() : 'SecureBank',
      accountNumber: `**** **** **** ${randomLast4}`,
      balance: 1000, // default starting balance per new account
    };

    user.accounts.push(newAccount);
    await user.save();

    return res.status(201).json({
      success: true,
      account: newAccount,
      accounts: user.accounts,
    });
  } catch (error) {
    console.error('addAccount error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/accounts/add-money - add money to a specific account
exports.addMoney = async (req, res) => {
  try {
    const { accountId, amount } = req.body;

    if (!accountId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account ID and positive amount are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accountIndex = user.accounts.findIndex(acc => acc.accountId === accountId);
    if (accountIndex === -1) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    user.accounts[accountIndex].balance += Number(amount);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Money added successfully',
      account: user.accounts[accountIndex],
      accounts: user.accounts,
    });
  } catch (error) {
    console.error('addMoney error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
