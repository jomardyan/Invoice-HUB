import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    poolMin: number;
    poolMax: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  email: {
    primary: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
      fromName: string;
    };
    failover: {
      host: string;
      port: number;
      user: string;
      password: string;
    };
  };
  allegro: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    sandbox: boolean;
    apiUrl: string;
  };
  baselinker: {
    apiUrl: string;
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  upload: {
    maxFileSize: number;
    path: string;
  };
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
  };
  monitoring: {
    sentryDsn?: string;
    logLevel: string;
  };
  features: {
    allegroIntegration: boolean;
    baselinkerIntegration: boolean;
    mfa: boolean;
    webhooks: boolean;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'invoice_hub',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  email: {
    primary: {
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || 'noreply@invoice-hub.com',
      fromName: process.env.SMTP_FROM_NAME || 'Invoice-HUB',
    },
    failover: {
      host: process.env.SMTP_FAILOVER_HOST || '',
      port: parseInt(process.env.SMTP_FAILOVER_PORT || '587', 10),
      user: process.env.SMTP_FAILOVER_USER || '',
      password: process.env.SMTP_FAILOVER_PASSWORD || '',
    },
  },

  allegro: {
    clientId: process.env.ALLEGRO_CLIENT_ID || '',
    clientSecret: process.env.ALLEGRO_CLIENT_SECRET || '',
    redirectUri: process.env.ALLEGRO_REDIRECT_URI || '',
    sandbox: process.env.ALLEGRO_SANDBOX === 'true',
    apiUrl: process.env.ALLEGRO_API_URL || 'https://api.allegro.pl',
  },

  baselinker: {
    apiUrl: process.env.BASELINKER_API_URL || 'https://api.baselinker.com/connector.php',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'change-this-32-character-key!!!',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  },

  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    path: process.env.UPLOAD_PATH || './uploads',
  },

  aws: process.env.AWS_ACCESS_KEY_ID
    ? {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        s3Bucket: process.env.AWS_S3_BUCKET || '',
      }
    : undefined,

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  features: {
    allegroIntegration: process.env.FEATURE_ALLEGRO_INTEGRATION === 'true',
    baselinkerIntegration: process.env.FEATURE_BASELINKER_INTEGRATION === 'true',
    mfa: process.env.FEATURE_MFA === 'true',
    webhooks: process.env.FEATURE_WEBHOOKS === 'true',
  },
};

export default config;
