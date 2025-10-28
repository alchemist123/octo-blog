require('dotenv').config();
import { SequelizeOptions } from 'sequelize-typescript';
import { Models } from '../shared/models';
export const options: SequelizeOptions = {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST as string,
  port: parseInt(process.env.POSTGRES_PORT as string, 10),
  username: process.env.POSTGRES_USERNAME as string,
  password: process.env.POSTGRES_PASSWORD as string,
  database: process.env.POSTGRES_DATABASE as string,
  models: Models,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
    evict: 5000,
  },
  dialectOptions: {
    connectTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  retry: {
    max: 5,
  },
};

