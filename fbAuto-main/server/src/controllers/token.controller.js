import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET } from '../credentials.js';

const prisma = new PrismaClient();

/**
 * Generate a fresh token for bookmarklet automation
 * This endpoint allows the bookmarklet to get a fresh token automatically
 */
const generateBookmarkletToken = async (req, res) => {
  try {
    // For bookmarklet automation, we'll use a predefined user
    // In production, you might want to add additional security
    const automationUserId = 'cmgm1fmmm0000pp01qr9am19b'; // Your user ID
    
    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: automationUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Automation user not found' });
    }

    // Generate a new token with longer expiration for automation
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        purpose: 'bookmarklet-automation'
      },
            JWT_SECRET,
      { expiresIn: '30d' } // Long-lived token for automation
    );

    res.json({
      token,
      userId: user.id,
      email: user.email,
      expiresIn: '30d',
      generatedAt: new Date().toISOString(),
      purpose: 'bookmarklet-automation'
    });

  } catch (error) {
    console.error('Error generating bookmarklet token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

/**
 * Validate if a token is still valid
 */
const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found', valid: false });
    }

    res.json({
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      purpose: decoded.purpose,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        valid: false,
        expired: true 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token', 
        valid: false 
      });
    }

    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
};

/**
 * Get current token info without validating (for debugging)
 */
const getTokenInfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Decode without verification to get info
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    res.json({
      userId: decoded.userId,
      email: decoded.email,
      purpose: decoded.purpose,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      isExpired: Date.now() > decoded.exp * 1000,
      timeUntilExpiry: decoded.exp * 1000 - Date.now()
    });

  } catch (error) {
    console.error('Get token info error:', error);
    res.status(500).json({ error: 'Failed to get token info' });
  }
};

export {
  generateBookmarkletToken,
  validateToken,
  getTokenInfo
};