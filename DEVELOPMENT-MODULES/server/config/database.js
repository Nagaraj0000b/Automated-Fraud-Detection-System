const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use env var if provided, otherwise local MongoDB (IPv4 to avoid ::1 issues)
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud-detection-auth';

    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connected to MongoDB');
    console.log(
      `🗄️  Database: ${
        MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'
      }`
    );
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;