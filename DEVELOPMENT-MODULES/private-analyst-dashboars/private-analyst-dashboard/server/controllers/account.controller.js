const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const { ensureUser } = require('../services/demoStore');

const resolveSessionUserId = (req) => req.user?.userId || req.user?.id || '';
const isDemoSession = (req) => {
  const sessionUserId = resolveSessionUserId(req);
  return (
    !sessionUserId ||
    !mongoose.Types.ObjectId.isValid(sessionUserId)
  );
};

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
    if (!connectDB.isConnected() || isDemoSession(req)) {
      const demoUser = ensureUser(req.user);
      return res.status(200).json({
        success: true,
        accounts: demoUser.accounts,
      });
    }

    const user = await User.findById(resolveSessionUserId(req));
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

    if (!connectDB.isConnected() || isDemoSession(req)) {
      const demoUser = ensureUser(req.user);
      const newAccount = {
        accountId: new mongoose.Types.ObjectId().toString(),
        bankName: bankName && bankName.trim() ? bankName.trim() : 'New Bank Account',
        accountNumber: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
        balance: 50000,
      };

      demoUser.accounts.push(newAccount);

      return res.status(201).json({
        success: true,
        account: newAccount,
        accounts: demoUser.accounts,
      });
    }

    const user = await User.findById(resolveSessionUserId(req));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ensureDefaultAccount(user);

    const newAccountId = new mongoose.Types.ObjectId().toString();
    const randomLast4 = Math.floor(1000 + Math.random() * 9000);

    const newAccount = {
      accountId: newAccountId,
      bankName: bankName && bankName.trim() ? bankName.trim() : 'New Bank Account',
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
