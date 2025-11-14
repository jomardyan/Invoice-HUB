import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from '@/config';

export interface JWTPayload extends JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
  roles: string[];
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const signOptions: SignOptions = {
    expiresIn: config.jwt.accessExpiry as any,
    issuer: 'invoice-hub',
    audience: 'invoice-hub-api',
  };
  return jwt.sign(payload, config.jwt.secret, signOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const signOptions: SignOptions = {
    expiresIn: config.jwt.refreshExpiry as any,
    issuer: 'invoice-hub',
    audience: 'invoice-hub-api',
  };
  return jwt.sign(payload, config.jwt.refreshSecret, signOptions);
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'invoice-hub',
      audience: 'invoice-hub-api',
    }) as JWTPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'invoice-hub',
      audience: 'invoice-hub-api',
    }) as JWTPayload;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
