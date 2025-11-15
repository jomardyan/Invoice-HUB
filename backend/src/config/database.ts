import { DataSource } from 'typeorm';
import config from './index';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host || 'localhost',
  port: config.database.port || 5432,
  username: config.database.user || 'postgres',
  password: config.database.password || 'postgres',
  database: config.database.name || 'invoice_hub',
  synchronize: config.env === 'development',
  logging: config.env === 'development',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  extra: {
    min: config.database.poolMin || 2,
    max: config.database.poolMax || 10,
  },
});
