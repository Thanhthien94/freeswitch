import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: ['.env.local', '.env'] });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'pbx_user',
  password: process.env.POSTGRES_PASSWORD || 'pbx_password',
  database: process.env.POSTGRES_DB || 'pbx_db',
  entities: [
    join(__dirname, '../**/*.entity{.ts,.js}'),
  ],
  migrations: [
    join(__dirname, './migrations/*{.ts,.js}'),
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
  migrationsTableName: 'migrations',
});
