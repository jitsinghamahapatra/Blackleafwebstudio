import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Models
import User from './server/models/User.js';
import Package from './server/models/Package.js';
import Project from './server/models/Project.js';
import Request from './server/models/Request.js';
import Content from './server/models/Content.js';

// Middleware
import { auth, admin } from './server/middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blackleafwebstudio_db_user:password@cluster0.nimpnyw.mongodb.net/blackleaf';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforblackleafstudio';
const ADMIN_EMAIL = 'jitsinghamahapatra2006@gmail.com';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Helpers
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Google Login / Verification
app.post('/api/auth/google-login', async (req, res) => {
  const { email, name, googleId } = req.body;
  if (!email || !googleId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // User doesn't exist, we must show details completion page first
      return res.json({ isNewUser: true, email, name, googleId });
    }

    // If user exists but doesn't have Google ID linked, link it
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// Complete Registration details (Phone + Password)
app.post('/api/auth/register-details', async (req, res) => {
  const { email, name, phone, password, googleId } = req.body;
  if (!email || !name || !phone || !password) {
    return res.status(400).json({ message: 'Missing registration details' });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Set role to admin if it's the admin email
    const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

    user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password, // Pre-save middleware handles hashing
      googleId: googleId || null,
      role
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration details error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Email & Password Login
app.post('/api/auth/email-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Email login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Update Profile
app.post('/api/auth/update-profile', auth, async (req, res) => {
  const { name, phone, password, email } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Name and phone can always be changed
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    // Password update
    if (password) {
      if (!req.body.oldPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.comparePassword(req.body.oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      user.password = password; // Pre-save hooks will hash it
    }

    // Note: Email is not changeable as per requirement, but we check if mismatch
    if (email && email.toLowerCase() !== user.email) {
      return res.status(400).json({ message: 'Email address cannot be changed' });
    }

    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});


// ==========================================
// GLOBAL CONTENT ROUTES (HERO)
// ==========================================
app.get('/api/content/:key', async (req, res) => {
  try {
    const content = await Content.findOne({ $or: [{ key: req.params.key }, { _id: req.params.key }] });
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching content' });
  }
});

app.post('/api/content/:key', auth, admin, async (req, res) => {
  const { priceTag, title, desc, img } = req.body;
  try {
    let content = await Content.findOne({ $or: [{ key: req.params.key }, { _id: req.params.key }] });
    if (!content) {
      content = new Content({ _id: req.params.key, key: req.params.key });
    }
    content.priceTag = priceTag;
    content.title = title;
    content.desc = desc;
    content.img = img;
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating content' });
  }
});


// ==========================================
// PACKAGES ROUTES
// ==========================================
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find().sort({ _id: 1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching packages' });
  }
});

app.post('/api/packages', auth, admin, async (req, res) => {
  const { id, name, price, img, features } = req.body;
  try {
    const pkg = new Package({ _id: id, name, price, img, features });
    await pkg.save();
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating package' });
  }
});

app.put('/api/packages/:id', auth, admin, async (req, res) => {
  const { name, price, img, features } = req.body;
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { name, price, img, features },
      { new: true }
    );
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating package' });
  }
});

app.delete('/api/packages/:id', auth, admin, async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting package' });
  }
});


// ==========================================
// PROJECTS ROUTES
// ==========================================
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

app.post('/api/projects', auth, admin, async (req, res) => {
  const { title, desc, img, link } = req.body;
  try {
    const project = new Project({ title, desc, img, link });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating project' });
  }
});

app.put('/api/projects/:id', auth, admin, async (req, res) => {
  const { title, desc, img, link } = req.body;
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { title, desc, img, link },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating project' });
  }
});

app.delete('/api/projects/:id', auth, admin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting project' });
  }
});


// ==========================================
// REQUESTS / ORDERS ROUTES
// ==========================================
app.get('/api/orders', auth, admin, async (req, res) => {
  try {
    const requests = await Request.find().sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

app.post('/api/orders', auth, async (req, res) => {
  const { name, email, package: pkg, details } = req.body;
  try {
    const request = new Request({
      uid: req.user.id,
      name,
      email: email.toLowerCase(),
      package: pkg,
      details
    });
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating order' });
  }
});

app.put('/api/orders/:id', auth, admin, async (req, res) => {
  const { status } = req.body;
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating order' });
  }
});

app.delete('/api/orders/:id', auth, admin, async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting order' });
  }
});


// ==========================================
// PRODUCTION BUILD STATIC SERVING
// ==========================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
