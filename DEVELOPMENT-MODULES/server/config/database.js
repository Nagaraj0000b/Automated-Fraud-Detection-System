const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    // Try primary URI with a 5 second timeout so we don't hang forever
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud-detection-auth';
      
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    console.log('✅ Connected to MongoDB');
    console.log(
      `🗄️  Database: ${
        MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'
      }`
    );
  } catch (error) {
    console.error('❌ MongoDB primary connection failed:', error.message);
    console.log('🔄 Spinning up real In-Memory MongoDB Server as fallback...');
    
    try {
      // Start a real MongoDB server in memory
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      await mongoose.connect(memoryUri);
      
      console.log('✅ Connected to In-Memory MongoDB (Fallback)');
      console.log(`🗄️  Database: MongoDB Memory Server at ${memoryUri}`);
    } catch (fallbackError) {
      console.error('❌ Failed to start in-memory MongoDB fallback:', fallbackError);
    }
  }
};

connectDB.isConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;