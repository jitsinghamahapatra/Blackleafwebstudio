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
import Message from './server/models/Message.js';

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
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (mongoose.connection.readyState === 2) {
    // Wait for the connection to be established
    await new Promise((resolve) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        mongoose.connection.removeListener('connected', onConnected);
        mongoose.connection.removeListener('error', onError);
      };
      mongoose.connection.once('connected', onConnected);
      mongoose.connection.once('error', onError);
      
      // Safety timeout: 8 seconds
      setTimeout(() => {
        cleanup();
        resolve();
      }, 8000);
    });
    return mongoose.connection;
  }
  
  // If disconnected (readyState 0), initiate connection
  return mongoose.connect(MONGODB_URI);
};

// Initial connection attempt (runs in background for normal node servers)
connectDB().catch(err => console.error('Initial MongoDB connection error:', err));

// Database connection status check endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    await connectDB();
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      connected: isConnected,
      status: isConnected ? 'connected' : 'disconnected'
    });
  } catch (err) {
    res.json({
      connected: false,
      status: 'disconnected',
      error: err.message
    });
  }
});

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
  const { status, paymentStatus } = req.body;
  try {
    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      updateFields,
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

// GET /api/orders/my -> fetch logged-in user's requests
app.get('/api/orders/my', auth, async (req, res) => {
  try {
    const requests = await Request.find({ uid: req.user.id }).sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching your orders' });
  }
});

// GET /api/orders/track/:id -> Public tracking endpoint
app.get('/api/orders/track/:id', async (req, res) => {
  let searchId = req.params.id.trim();
  if (searchId.toUpperCase().startsWith("INV-")) {
    searchId = searchId.substring(4);
  }
  
  try {
    let order = null;
    if (searchId.length === 24) {
      order = await Request.findById(searchId);
    }
    if (!order) {
      order = await Request.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: '^' + searchId,
            options: 'i'
          }
        }
      });
    }
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: {
        _id: order._id,
        package: order.package,
        status: order.status,
        paymentStatus: order.paymentStatus || 'Not Paid',
        timestamp: order.timestamp
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error tracking order' });
  }
});

// GET /api/content/theme -> Fetch theme settings (Public)
app.get('/api/content/theme', async (req, res) => {
  try {
    const theme = await Content.findOne({ key: 'theme' });
    if (!theme) {
      return res.json({ accentColor: '#ffc2d1', bgColor: '#f9f7f2' });
    }
    res.json({
      accentColor: theme.accentColor || '#ffc2d1',
      bgColor: theme.bgColor || '#f9f7f2'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching theme settings' });
  }
});

// POST /api/content/theme -> Save theme settings (Admin only)
app.post('/api/content/theme', auth, admin, async (req, res) => {
  const { accentColor, bgColor } = req.body;
  try {
    let theme = await Content.findOne({ key: 'theme' });
    if (!theme) {
      theme = new Content({ key: 'theme' });
    }
    theme.accentColor = accentColor || '#ffc2d1';
    theme.bgColor = bgColor || '#f9f7f2';
    await theme.save();
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ message: 'Server error saving theme settings' });
  }
});

// ==========================================
// MESSAGES ROUTES
// ==========================================

// POST /api/messages -> Submit a new message (authenticate optionally)
app.post('/api/messages', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Extract user if logged in
  let uid = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
      uid = decoded.id;
    } catch (e) {
      // Allow continuing as guest if token is invalid or expired
    }
  }

  try {
    const newMessage = new Message({
      uid,
      name,
      email: email.toLowerCase(),
      subject,
      message,
      readByAdmin: false,
      readByUser: true
    });
    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// GET /api/messages -> Get all messages (Admin only)
app.get('/api/messages', auth, admin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// GET /api/messages/my -> Get logged-in user's messages
app.get('/api/messages/my', auth, async (req, res) => {
  try {
    const messages = await Message.find({ uid: req.user.id }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching your messages' });
  }
});

// GET /api/messages/unread-count -> Get count of unread replies
app.get('/api/messages/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({ uid: req.user.id, readByUser: false });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error checking unread messages' });
  }
});

// POST /api/messages/:id/reply -> Reply to a message (Auth user, Admin or Owner)
app.post('/api/messages/:id/reply', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Reply text is required' });
  }

  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message thread not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = msg.uid === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to reply to this thread' });
    }

    const reply = {
      sender: isAdmin ? 'admin' : 'user',
      senderName: req.user.name || (isAdmin ? 'Admin' : 'Client'),
      text,
      timestamp: new Date()
    };

    msg.replies.push(reply);
    
    if (isAdmin) {
      msg.status = 'Replied';
      msg.readByUser = false; // Trigger alert/badge for user
    } else {
      msg.status = 'Open';
      msg.readByAdmin = false; // Trigger notification alert for admin
    }

    // Mark as read by the person who replied
    if (isAdmin) {
      msg.readByAdmin = true;
    } else {
      msg.readByUser = true;
    }

    await msg.save();
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ message: 'Server error posting reply' });
  }
});

// PUT /api/messages/:id/read -> Mark messages as read by user or admin
app.put('/api/messages/:id/read', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    if (req.user.role === 'admin') {
      msg.readByAdmin = true;
    } else if (msg.uid === req.user.id) {
      msg.readByUser = true;
    }
    
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error marking read' });
  }
});


// ==========================================
// PRODUCTION BUILD STATIC SERVING
// ==========================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start Server (only if not running on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
