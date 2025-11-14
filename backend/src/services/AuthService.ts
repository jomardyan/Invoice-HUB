import { AppDataSource } from '@/config/database';
import { User, UserRole } from '@/entities/User';
import { Tenant, SubscriptionTier, SubscriptionStatus } from '@/entities/Tenant';
import { hashPassword, verifyPassword, generateRandomToken } from '@/utils/password';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '@/utils/jwt';
import logger from '@/utils/logger';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
  };
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async register(input: RegisterInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create tenant
      const tenant = this.tenantRepository.create() as Tenant;
      tenant.name = input.tenantName;
      tenant.subscriptionTier = SubscriptionTier.FREE;
      tenant.subscriptionStatus = SubscriptionStatus.TRIAL;
      tenant.invoiceQuotaPerMonth = 100;
      tenant.isActive = true;

      const savedTenant = await this.tenantRepository.save(tenant);
      logger.info(`Tenant created: ${savedTenant.id}`);

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user (first user is admin)
      const user = this.userRepository.create({
        tenantId: savedTenant.id,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.ADMIN,
        emailVerified: false,
        emailVerificationToken: generateRandomToken(),
        isActive: true,
      });

      const savedUser = await this.userRepository.save(user);
      logger.info(`User registered: ${savedUser.id} in tenant ${savedTenant.id}`);

      // Generate tokens
      const payload: JWTPayload = {
        userId: savedUser.id,
        email: savedUser.email,
        tenantId: savedUser.tenantId,
        roles: [savedUser.role],
      };

      return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName || '',
          lastName: savedUser.lastName || '',
          role: savedUser.role,
          tenantId: savedUser.tenantId,
        },
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    try {
      // Find user by email and tenant
      const user = await this.userRepository.findOne({
        where: {
          email: input.email,
          tenantId: input.tenantId,
        },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check account status
      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // Verify password
      const passwordValid = await verifyPassword(input.password, user.passwordHash);
      if (!passwordValid) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        await this.userRepository.save(user);
        throw new Error('Invalid email or password');
      }

      // Reset failed attempts on successful login
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined as any;
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roles: [user.role],
      };

      return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
          tenantId: user.tenantId,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string, tenantId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email,
          tenantId,
        },
      });

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      const token = generateRandomToken();
      user.passwordResetToken = token;
      user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.userRepository.save(user);
      logger.info(`Password reset requested for user: ${user.id}`);

      // In production, send email with reset link
      // await emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(email: string, tenantId: string, token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email,
          tenantId,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify token
      if (!user.passwordResetToken || user.passwordResetToken !== token) {
        throw new Error('Invalid reset token');
      }

      // Check token expiry
      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);
      user.passwordHash = passwordHash;
      user.passwordResetToken = undefined as any;
      user.passwordResetExpiry = undefined as any;

      await this.userRepository.save(user);
      logger.info(`Password reset for user: ${user.id}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

export default new AuthService();
