require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realdebrid-manager', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('\n⚠️  An admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      
      const answer = await question('\nDo you want to create another admin? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('Exiting...');
        process.exit(0);
      }
    }
    
    console.log('\n🔧 Create Admin User');
    console.log('==================\n');
    
    // Get admin details from environment or prompt
    let username, email, password;
    
    // Check if details are in environment variables
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log('Using credentials from environment variables...\n');
      
      username = 'admin';
      email = process.env.ADMIN_EMAIL;
      password = process.env.ADMIN_PASSWORD;
      
      console.log(`Username: ${username}`);
      console.log(`Email: ${email}`);
      console.log(`Password: [from environment]`);
      
      const answer = await question('\nProceed with these credentials? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\nPlease enter custom credentials:');
        username = await question('Username: ');
        email = await question('Email: ');
        password = await question('Password: ');
      }
    } else {
      // Prompt for credentials
      username = await question('Username: ');
      email = await question('Email: ');
      password = await question('Password: ');
    }
    
    // Validate inputs
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address');
    }
    
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      throw new Error('A user with this username or email already exists');
    }
    
    // Create admin user
    const admin = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password,
      role: 'admin',
      isActive: true
    });
    
    await admin.save();
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('Details:');
    console.log('--------');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`ID: ${admin._id}`);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n👋 Goodbye!');
    process.exit(0);
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n\nOperation cancelled.');
  rl.close();
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
console.log('🚀 Real-Debrid Manager - Admin Setup');
console.log('=====================================\n');

createAdmin();