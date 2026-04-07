const dns = require('dns');
const mongoose = require('mongoose');

let dbConnected = false;

const connectDB = async () => {
  try {
    // Use env var if provided, otherwise local MongoDB (IPv4 to avoid ::1 issues)
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud-detection-auth';

    if (MONGODB_URI.startsWith('mongodb+srv://')) {
      // Some Windows / ISP DNS setups fail Atlas SRV lookups. Use public resolvers for Atlas.
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }

    await mongoose.connect(MONGODB_URI);
    dbConnected = true;

    console.log('✅ Connected to MongoDB');
    console.log(
      `🗄️  Database: ${
        MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'
      }`
    );
  } catch (error) {
    dbConnected = false;
    console.error('❌ MongoDB connection error:', error);
    console.warn('Starting server in temporary offline demo mode.');
  }
};

connectDB.isConnected = () => dbConnected || mongoose.connection.readyState === 1;

module.exports = connectDB;
