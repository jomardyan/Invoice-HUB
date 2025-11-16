import { Router, Request, Response, Express } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '@/services/AuthService';
import { authLimiter } from '@/middleware/rateLimiter';
import logger from '@/utils/logger';

const router: Express = Router() as Express;

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain special character'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('tenantName').trim().notEmpty().withMessage('Tenant name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('tenantId').optional().isUUID().withMessage('Valid tenant ID is required'),
];

const tenantLookupValidation = [
  body('email').isEmail().normalizeEmail(),
];

// Tenant lookup endpoint (get tenant by user email)
router.post('/lookup-tenant', tenantLookupValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        error: errors.array(),
      });
      return;
    }

    const { email } = req.body;
    const user = await authService.getUserByEmail(email);

    if (!user) {
      res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    logger.error('Tenant lookup error:', error);
    res.status(404).json({
      status: 'error',
      statusCode: 404,
      message: 'User not found',
    });
  }
});

// Register endpoint
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        error: errors.array(),
      });
      return;
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Register endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';

    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: errorMessage,
    });
  }
});

// Login endpoint with rate limiting
router.post('/login', authLimiter, loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        error: errors.array(),
      });
      return;
    }

    // If tenantId is not provided, look it up by email
    let loginInput = req.body;
    if (!loginInput.tenantId) {
      const tenantLookup = await authService.getUserByEmail(loginInput.email);
      if (!tenantLookup) {
        res.status(404).json({
          status: 'error',
          statusCode: 404,
          message: 'User not found',
        });
        return;
      }
      loginInput = {
        ...loginInput,
        tenantId: tenantLookup.tenantId,
      };
    }

    const result = await authService.login(loginInput);

    // Set secure cookie for refresh token (in production)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    logger.error('Login endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';

    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: errorMessage,
    });
  }
});

// Request password reset
router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email, tenantId } = req.body;

    if (!email || !tenantId) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Email and tenant ID are required',
      });
      return;
    }

    await authService.requestPasswordReset(email, tenantId);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Request password reset error:', error);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'If the email exists, a password reset link has been sent',
    });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, tenantId, token, newPassword } = req.body;

    if (!email || !tenantId || !token || !newPassword) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Email, tenant ID, token, and new password are required',
      });
      return;
    }

    await authService.resetPassword(email, tenantId, token, newPassword);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';

    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: errorMessage,
    });
  }
});

// Refresh access token
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Refresh token is required',
      });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';

    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: errorMessage,
    });
  }
});

// Logout endpoint
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    // Clear refresh token cookie if it exists
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Logged out successfully',
    });
  }
});

export default router;
