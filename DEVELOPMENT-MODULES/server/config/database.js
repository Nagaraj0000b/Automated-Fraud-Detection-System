const dns = require('dns');
const mongoose = require('mongoose');

let dbConnected = false;

const connectDB = async () => {
  try {
    // Use env var if provided, otherwise local MongoDB (IPv4 to avoid ::1 issues)
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud-detection-auth';

    if (MONGODB_URI.startsWith('mongodb+srv://')) {
      // Atlas SRV DNS resolution can be flaky on some Windows setups.
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }

    await mongoose.connect(MONGODB_URI);
    dbConnected = true;

    console.log('âœ… Connected to MongoDB');
    console.log(
      `ðŸ—„ï¸  Database: ${
        MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'
      }`
    );
  } catch (error) {
    dbConnected = false;
    console.error('âŒ MongoDB connection error:', error);
    throw error;
  }
};

connectDB.isConnected = () => dbConnected || mongoose.connection.readyState === 1;

module.exports = connectDB;
