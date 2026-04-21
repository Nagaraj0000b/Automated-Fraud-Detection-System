const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud-detection-auth';

// Demo users to seed
const demoUsers = [
  // Admin accounts
  {
    email: 'admin@fraudshield.com',
    password: 'Admin@123',
    name: 'Sarah Johnson',
    role: 'admin',
    department: 'Security Operations',
    status: 'active'
  },
  {
    email: 'admin2@fraudshield.com',
    password: 'Admin@456',
    name: 'Michael Chen',
    role: 'admin',
    department: 'IT Management',
    status: 'active'
  },

  // Analyst accounts
  {
    email: 'analyst@fraudshield.com',
    password: 'Analyst@123',
    name: 'Emily Davis',
    role: 'analyst',
    department: 'Fraud Analysis',
    status: 'active'
  },
  {
    email: 'analyst2@fraudshield.com',
    password: 'Analyst@456',
    name: 'James Wilson',
    role: 'analyst',
    department: 'Risk Assessment',
    status: 'active'
  },

  // Auditor accounts
  {
    email: 'auditor@fraudshield.com',
    password: 'Auditor@123',
    name: 'Rachel Green',
    role: 'auditor',
    department: 'Compliance',
    status: 'active'
  },

  // Regular user accounts
  {
    email: 'user@fraudshield.com',
    password: 'User@123',
    name: 'John Smith',
    role: 'user',
    department: 'General',
    status: 'active'
  },
  {
    email: 'user2@fraudshield.com',
    password: 'User@456',
    name: 'Lisa Anderson',
    role: 'user',
    department: 'General',
    status: 'active'
  },
  {
    email: 'user3@fraudshield.com',
    password: 'User@789',
    name: 'David Brown',
    role: 'user',
    department: 'General',
    status: 'active'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create and save each user with hashed password
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = new User({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        status: userData.status
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n--- Test Credentials ---\n');

    const roles = ['admin', 'analyst', 'auditor', 'user'];
    roles.forEach(role => {
      console.log(`\n🔹 ${role.toUpperCase()} accounts:`);
      demoUsers
        .filter(u => u.role === role)
        .forEach(user => {
          console.log(`  📧 ${user.email}  |  🔑 ${user.password}  |  👤 ${user.name}`);
        });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedUsers();
