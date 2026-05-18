import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

if (process.env.NODE_ENV === 'test' || !process.env.DB_HOST) {
  // Use SQLite for the preview environment or when MySQL isn't configured
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'database.sqlite'),
    logging: false,
  });
  console.log('[DB] Using SQLite for local development/preview.');
} else {
  // Use MySQL for XAMPP/Production
  sequelize = new Sequelize(
    process.env.DB_NAME || 'chattrix_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  console.log('[DB] Configuring MySQL connection (XAMPP).');
}

export default sequelize;
