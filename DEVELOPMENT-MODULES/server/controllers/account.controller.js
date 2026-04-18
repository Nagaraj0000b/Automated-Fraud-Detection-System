const mongoose = require('mongoose');
const User = require('../models/User');

// Ensure the user has at least one default account (for existing users)
const ensureDefaultAccount = async (user) => {
  if (user.accounts && user.accounts.length > 0) {
    return user;
  }

  const last4 = user._id.toString().slice(-4).toUpperCase();

  user.accounts = [
    {
      accountId: `acc-${user._id.toString()}`,
      bankName: 'SecureBank',
      accountNumber: `**** **** **** ${last4}`,
      balance: typeof user.accountBalance === 'number' ? user.accountBalance : 10000,
    },
  ];

  await user.save();
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

    const updatedUser = await ensureDefaultAccount(user);

    return res.status(200).json({
      success: true,
      accounts: updatedUser.accounts,
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

    await ensureDefaultAccount(user);

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
