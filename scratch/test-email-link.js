import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blackleafwebstudio_db_user:password@cluster0.nimpnyw.mongodb.net/blackleaf';

async function runTests() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const testEmail = 'testlinkreset@example.com';
    const initialPassword = 'OldSecretPass123';
    const newPassword = 'BrandNewPassword777!';

    // Clean up old test user
    await User.deleteOne({ email: testEmail });

    // 1. Create a test user
    console.log('Creating test user...');
    const user = new User({
      name: 'Test Link Reset User',
      email: testEmail,
      phone: '123-456-7890',
      password: initialPassword
    });
    await user.save();
    console.log('Test user created.');

    // 2. Simulate forgot-password token generation
    console.log('Generating reset token...');
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    console.log('Reset token saved to user.');

    // 3. Simulate reset-password-with-token logic
    console.log('Verifying reset password flow with token...');
    const dbUser = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!dbUser) {
      throw new Error('Test Fail: Could not find user with valid token');
    }
    console.log('User found with valid token.');

    dbUser.password = newPassword;
    dbUser.resetPasswordToken = null;
    dbUser.resetPasswordExpires = null;
    await dbUser.save();
    console.log('New password saved and tokens cleared.');

    // 4. Verify password update
    const updatedUser = await User.findOne({ email: testEmail });
    const isCorrect = await updatedUser.comparePassword(newPassword);
    const isOldIncorrect = await updatedUser.comparePassword(initialPassword);

    console.log('Verification:');
    console.log('- Compare new password:', isCorrect ? 'PASS' : 'FAIL');
    console.log('- Compare old password (should be invalid):', !isOldIncorrect ? 'PASS' : 'FAIL');

    if (isCorrect && !isOldIncorrect) {
      console.log('\nAll test cases PASSED!');
    } else {
      console.log('\nTest cases FAILED!');
    }

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('Cleaned up test user.');

    await mongoose.disconnect();
    console.log('Disconnected. Done.');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTests();
