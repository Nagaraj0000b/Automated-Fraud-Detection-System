const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Fix paths
const Transaction = require('../models/Transaction');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud-detection-auth');
    console.log('Connected to DB');

    const transactions = await Transaction.find().populate('user', 'name email');
    console.log(`Total transactions: ${transactions.length}`);
    
    transactions.forEach(tx => {
      console.log(`- ID: ${tx._id}, Amount: ${tx.amount}, Status: ${tx.status}, User: ${tx.user?.name || 'Unknown'} (${tx.user?._id || tx.user}), AccountID: ${tx.accountId}`);
    });

    const users = await User.find();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
        console.log(`- User: ${u.name}, ID: ${u._id}, Role: ${u.role}, Status: ${u.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTransactions();
