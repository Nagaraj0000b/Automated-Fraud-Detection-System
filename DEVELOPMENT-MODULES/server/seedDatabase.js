const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud-detection-auth';

// Demo users to seed
const demoUsers = [
  {
    email: 'admin@fraud-detection.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'user@fraud-detection.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create and save each user with hashed password
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest credentials:');
    demoUsers.forEach(user => {
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🔑 Password: ${user.password}`);
      console.log(`  👤 Role: ${user.role}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers();
