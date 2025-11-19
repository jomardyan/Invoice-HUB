import { DataSource } from 'typeorm';
import config from './index';
import path from 'path';

// Determine if we're running from compiled JavaScript or TypeScript
const isProduction = config.env === 'production';
const extension = isProduction ? 'js' : 'ts';
const baseDir = isProduction ? 'dist' : 'src';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host || 'localhost',
  port: config.database.port || 5432,
  username: config.database.user || 'postgres',
  password: config.database.password || 'postgres',
  database: config.database.name || 'invoice_hub',
  synchronize: config.env === 'development',
  logging: config.env === 'development',
  entities: [
    path.join(__dirname, `../${baseDir === 'dist' ? '' : ''}entities/**/*.${extension}`)
  ],
  migrations: [
    path.join(__dirname, `../${baseDir === 'dist' ? '' : ''}migrations/**/*.${extension}`)
  ],
  subscribers: [
    path.join(__dirname, `../${baseDir === 'dist' ? '' : ''}subscribers/**/*.${extension}`)
  ],
  extra: {
    min: config.database.poolMin || 2,
    max: config.database.poolMax || 10,
  },
});
