import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { CustomNamingStrategy } from './naming.strategy';

console.log({
  ENV_FILE_PATH: process.env.ENV_FILE_PATH,
  NODE_ENV: process.env.NODE_ENV,
});

config({
  path: [
    process.env.ENV_FILE_PATH?.trim() || '',
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`,
    '.env.production',
  ].filter(Boolean),
});

console.log({ POSTGRES_URI: process.env.POSTGRES_URI });

export default new DataSource({
  url: process.env.POSTGRES_URI,
  type: 'postgres',
  namingStrategy: new CustomNamingStrategy(),
  migrations: ['src/db/migrations/*.{js,ts}'],
  entities: ['src/**/*.entity.{js,ts}'],
  logging: true,
});
