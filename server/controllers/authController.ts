import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import User from '../models/User.ts';
import RefreshToken from '../models/RefreshToken.ts';
import EmailVerificationToken from '../models/EmailVerificationToken.ts';
import PasswordResetToken from '../models/PasswordResetToken.ts';
import { generateAccessToken, generateRefreshToken } from '../services/jwt.ts';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/email.ts';

export const register = async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, username, email, phoneNumber, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      phoneNumber,
      passwordHash,
    });

    // Create verification token
    const token = crypto.randomBytes(32).toString('hex');
    await EmailVerificationToken.create({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    // Send email
    try {
      await sendVerificationEmail(email, token);
    } catch (err) {
      console.error('Email sending failed:', err);
    }

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: any, res: any) => {
  const { loginIdentifier, password } = req.body; // email or username

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      }
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset attempts on success
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    await user.save();

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        about: user.about,
        status: user.status,
        ghostMode: user.ghostMode,
        autoReply: user.autoReply,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: any, res: any) => {
  const { token } = req.query;

  try {
    const verificationToken = await EmailVerificationToken.findOne({ where: { token } });
    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findByPk(verificationToken.userId);
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    await verificationToken.destroy();
    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: any, res: any) => {
  const { refreshToken } = req.body;
  try {
    await RefreshToken.destroy({ where: { token: refreshToken } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const savedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!savedToken || savedToken.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = generateAccessToken(savedToken.userId);
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

export const forgotPassword = async (req: any, res: any) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No user found with this email' });

    const token = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    await sendResetPasswordEmail(email, token);
    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: any, res: any) => {
  const { token, password } = req.body;
  try {
    const resetToken = await PasswordResetToken.findOne({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findByPk(resetToken.userId);
    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      await user.save();
    }

    await resetToken.destroy();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
