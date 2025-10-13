// controllers/authController.js
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set in environment variables');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Basic check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    // auth middleware attaches req.user.userId
    const userId = req?.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req?.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
