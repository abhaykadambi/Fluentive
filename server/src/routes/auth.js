const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware for input validation
const validateSignup = [
  body('name').trim().isLength({ min: 3 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Signup route
router.post('/signup', validateSignup, async (req, res) => {
  console.log('signup route called with body:', req.body);
  try {
    console.log('Starting validation check...');
    const errors = validationResult(req);
    console.log('Validation result:', errors.array());
    if (!errors.isEmpty()) {
      console.log('Validation failed with errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('Validation passed, proceeding with user creation...');

    const { name, email, password } = req.body;
    console.log('tried 2')
    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username: name }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log('tried 3')
    // Create new user
    user = new User({
      username: name,
      email,
      password
    });
    console.log('tried 4')
    await user.save();
    console.log('tried 5')
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '365d' }
    );
    console.log('tried 6')
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    console.log('tried 7')
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 