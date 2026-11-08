require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const { validateProfile, validateLogin } = require('./validation');
const app = express();
app.disable('x-powered-by');

// Add basic security headers, accept JSON requests, and serve frontend files.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Describe the user data MongoDB stores for this application.
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true }
}, { timestamps: true }));

// Limit repeated requests to routes that handle account registration and login.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Return only profile details that are safe and useful to send to the browser.
function publicUser(user) {
  return {
    username: user.username,
    email: user.email,
    phone: user.phone,
    dob: user.dob.toISOString().slice(0, 10)
  };
}

// Check the login token before allowing a request to access a private route.
function auth(req, res, next) {
  // CUSTOM NOTE: Keep the token out of the profile response and verify it on every request.
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    }).sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}
// Provide a small endpoint that reports whether the server is responding.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Create an account after checking the submitted details and hashing the password.
app.post('/api/register', limiter, async (req, res) => {
  try {
    const { username, password, email, phone, dob } = req.body || {};
    const error = validateProfile({ email, phone, dob });
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username || '')) {
      return res.status(400).json({
        error: 'Username must be 3–30 letters, numbers or underscores.'
      });
    }
    if (typeof password !== 'string' || password.length < 10) {
      return res.status(400).json({
        error: 'Password must be at least 10 characters.'
      });
    }
    if (error) return res.status(400).json({ error });

    const user = await User.create({
      username,
      password: await bcrypt.hash(password, 12),
      email,
      phone,
      dob: new Date(dob + 'T00:00:00Z')
    });
    return res
      .status(201)
      .json({ message: 'Account created.', user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Could not create account.' });
  }
});

// Check submitted credentials and return a signed token for a valid account.
app.post('/api/login', limiter, async (req, res) => {
  try {
    const error = validateLogin(req.body || {});
    if (error) return res.status(400).json({ error });

    const user = await User.findOne({ username: req.body.username }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res
        .status(401)
        .json({ error: 'Incorrect username or password.' });
    }
    const token = jwt.sign(
      { sub: String(user._id) },
      process.env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});
// Return the current user's details after the auth middleware verifies the token.
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Could not load profile.' });
  }
});

// Update only editable profile fields; authentication identifies the account.
app.put('/api/profile', auth, async (req, res) => {
  const { email, phone, dob } = req.body || {};
  const error = validateProfile({ email, phone, dob });
  if (error) return res.status(400).json({ error });

  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { email, phone, dob: new Date(dob + 'T00:00:00Z') },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ message: 'Profile saved successfully.', user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Could not save profile.' });
  }
});

// Use the login page for the site's root URL.
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Only connect to MongoDB and start listening when this file runs directly.
if (require.main === module) {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    !process.env.MONGODB_URI
  ) {
    console.error('Set MONGODB_URI and a strong JWT_SECRET in .env');
    process.exit(1);
  }

  mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: 'profile_manager'
    })
    .then(() => {
      console.log('MongoDB connected successfully!');
      console.log('Database: ' + mongoose.connection.name);

      app.listen(process.env.PORT || 3000, () => {
        console.log('PRDA Profile Manager server ready');
        console.log(`Website: http://localhost:${process.env.PORT || 3000}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
