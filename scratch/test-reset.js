import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blackleafwebstudio_db_user:password@cluster0.nimpnyw.mongodb.net/blackleaf';

async function runTests() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const testEmail = 'testforgotpwd@example.com';
    const testPhone = '+1 (555) 123-4567';
    const testPassword = 'InitialPassword123';
    
    // Clean up old test user
    await User.deleteOne({ email: testEmail });
    
    // Create new test user
    console.log('Creating test user...');
    const user = new User({
      name: 'Test Forgot Pwd User',
      email: testEmail,
      phone: testPhone,
      password: testPassword
    });
    await user.save();
    console.log('Test user created successfully.');

    // Test cases:
    // 1. Verify exact phone number match
    const testCase1 = await mockResetLogic(testEmail, '+1 (555) 123-4567', 'NewPassword999!');
    console.log('Test Case 1 (Exact Phone match) result:', testCase1 ? 'PASS' : 'FAIL');

    // 2. Verify normalized phone number match
    await updatePasswordDirectly(testEmail, 'InitialPassword123');
    const testCase2 = await mockResetLogic(testEmail, '15551234567', 'NewPassword999!');
    console.log('Test Case 2 (Normalized Phone match) result:', testCase2 ? 'PASS' : 'FAIL');

    // 3. Verify non-matching phone number failure
    const testCase3 = await mockResetLogic(testEmail, '15550000000', 'NewPassword999!');
    console.log('Test Case 3 (Incorrect Phone mismatch) result:', !testCase3 ? 'PASS (Correctly rejected)' : 'FAIL (Incorrectly accepted)');

    // 4. Verify non-existent email failure
    const testCase4 = await mockResetLogic('nonexistent@example.com', '15551234567', 'NewPassword999!');
    console.log('Test Case 4 (Non-existent email) result:', !testCase4 ? 'PASS (Correctly rejected)' : 'FAIL (Incorrectly accepted)');

    // Clean up test user
    await User.deleteOne({ email: testEmail });
    console.log('Cleaned up test user.');

    await mongoose.disconnect();
    console.log('Disconnected from database. All tests finished.');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

async function updatePasswordDirectly(email, password) {
  const user = await User.findOne({ email });
  user.password = password;
  await user.save();
}

async function mockResetLogic(email, phone, newPassword) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return false;
  }
  
  const normalizedDbPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
  const normalizedInputPhone = phone ? phone.replace(/\D/g, '') : '';

  const phoneMatches = (normalizedDbPhone && normalizedDbPhone === normalizedInputPhone) || 
                       (user.phone && user.phone.trim() === phone.trim());

  if (!phoneMatches) {
    return false;
  }

  user.password = newPassword;
  await user.save();
  
  // Verify new password hashes matches comparePassword
  const updatedUser = await User.findOne({ email: email.toLowerCase() });
  const isCorrect = await updatedUser.comparePassword(newPassword);
  return isCorrect;
}

runTests();
