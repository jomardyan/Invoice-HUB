import * as crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve) => {
    // Using bcryptjs would be better, but crypto.pbkdf2 is built-in
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    resolve(`${salt}:${hash}`);
  });
};

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const [salt, hash] = passwordHash.split(':');
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    resolve(hash === verifyHash);
  });
};

export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateOTPSecret = (): string => {
  return crypto.randomBytes(20).toString('base64');
};
