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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
