import { register, login, refreshAccessToken, logout } from '../services/authService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { requestPasswordReset, resetPassword } from '../services/passwordResetService.js';

export async function registerHandler(req, res) {
  try {
    const { email, password, name, locale = 'fr' } = req.body;
    const user = await register(email, password, name, locale);
    
    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, name).catch(console.error);

    res.status(201).json({ user });
  } catch (error) {
    // Check if it's a database connection error
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR' || error.message.includes('Access denied')) {
      console.error('Database access error:', error.message);
      res.status(500).json({ 
        error: 'Database connection error. Please check your database configuration and permissions.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;

    const { accessToken, refreshToken, user } = await login(email, password, userAgent, ip);

    // Set refresh token cookie
    // For cross-origin cookies (frontend on different domain), don't set domain
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    
    // Only set domain if explicitly configured (for same-domain cookies)
    // For cross-origin (Vercel frontend + Render backend), don't set domain
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({ accessToken, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

export async function refreshHandler(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const { accessToken } = await refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

export async function logoutHandler(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    await logout(refreshToken);

    // Clear cookie with same options as when it was set
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'Lax',
    };
    
    // Only set domain if it was set when creating the cookie
    if (process.env.COOKIE_DOMAIN) {
      clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.clearCookie('refreshToken', clearCookieOptions);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function forgotPasswordHandler(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
}

export async function resetPasswordHandler(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    const result = await resetPassword(email, code, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message || 'Invalid or expired reset code' });
  }
}

