import { Router } from 'express';
import { authLimiter } from '@/middleware/rateLimiter';
import { asyncHandler } from '@/utils/asyncHandler';
import { AuthController } from '@/controllers/auth.controller';
import {
  registerValidation,
  loginValidation,
  tenantLookupValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  refreshTokenValidation,
} from '@/validators/auth.validation';

const router: Router = Router();

// Tenant lookup endpoint (get tenant by user email)
router.post(
  '/lookup-tenant',
  tenantLookupValidation,
  asyncHandler(AuthController.lookupTenant)
);

// Register endpoint
router.post(
  '/register',
  registerValidation,
  asyncHandler(AuthController.register)
);

// Login endpoint with rate limiting
router.post(
  '/login',
  authLimiter,
  loginValidation,
  asyncHandler(AuthController.login)
);

// Request password reset
router.post(
  '/request-password-reset',
  requestPasswordResetValidation,
  asyncHandler(AuthController.requestPasswordReset)
);

// Reset password
router.post(
  '/reset-password',
  resetPasswordValidation,
  asyncHandler(AuthController.resetPassword)
);

// Refresh access token
router.post(
  '/refresh-token',
  refreshTokenValidation,
  asyncHandler(AuthController.refreshToken)
);

// Logout endpoint
router.post(
  '/logout',
  asyncHandler(AuthController.logout)
);

export default router;
