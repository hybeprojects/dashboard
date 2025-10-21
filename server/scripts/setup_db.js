const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const { DB_HOST = 'localhost', DB_PORT = 3306, DB_USER = 'root', DB_PASSWORD = '' } = process.env;

const personalSchema = 'personal_users_db';
const businessSchema = 'business_users_db';

async function run() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log('Dropping schemas if they exist...');
    await connection.query(
      `DROP DATABASE IF EXISTS ${personalSchema}; DROP DATABASE IF EXISTS ${businessSchema};`,
    );

    console.log('Creating schemas...');
    await connection.query(`CREATE DATABASE ${personalSchema}; CREATE DATABASE ${businessSchema};`);

    console.log('Creating tables...');
    // users and accounts for personal
    await connection.query(`
      CREATE TABLE ${personalSchema}.users (
        id VARCHAR(36) PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        fineract_client_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE ${personalSchema}.accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        fineract_account_id INT,
        balance DECIMAL(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES ${personalSchema}.users(id) ON DELETE CASCADE
      );

      CREATE TABLE ${businessSchema}.users (
        id VARCHAR(36) PRIMARY KEY,
        business_name VARCHAR(255),
        contact_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        fineract_client_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE ${businessSchema}.accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_user_id VARCHAR(36),
        fineract_account_id INT,
        balance DECIMAL(24,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_user_id) REFERENCES ${businessSchema}.users(id) ON DELETE CASCADE
      );
    `);

    console.log('Seeding initial users...');
    const defaultSeedPwd = process.env.DEFAULT_SEED_PASSWORD || require('crypto').randomBytes(8).toString('hex');
    const seedUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        first: 'Personal1',
        last: 'User',
        email: 'personal1@example.com',
        pwd: defaultSeedPwd,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        first: 'Personal2',
        last: 'User',
        email: 'personal2@example.com',
        pwd: defaultSeedPwd,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        business: 'Demo Business LLC',
        contact: 'BizOwner',
        email: 'business@example.com',
        pwd: defaultSeedPwd,
      },
    ];

    const hashed1 = await bcrypt.hash(seedUsers[0].pwd, 10);
    const hashed2 = await bcrypt.hash(seedUsers[1].pwd, 10);
    const hashedBiz = await bcrypt.hash(seedUsers[2].pwd, 10);

    await connection.query(
      `INSERT INTO ${personalSchema}.users (id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?);`,
      [seedUsers[0].id, seedUsers[0].first, seedUsers[0].last, seedUsers[0].email, hashed1],
    );
    await connection.query(
      `INSERT INTO ${personalSchema}.users (id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?);`,
      [seedUsers[1].id, seedUsers[1].first, seedUsers[1].last, seedUsers[1].email, hashed2],
    );

    // business user
    await connection.query(
      `INSERT INTO ${businessSchema}.users (id, business_name, contact_name, email, password_hash) VALUES (?, ?, ?, ?, ?);`,
      [seedUsers[2].id, seedUsers[2].business, seedUsers[2].contact, seedUsers[2].email, hashedBiz],
    );

    console.log('Creating accounts and funding business...');
    // create accounts rows and set balances (business gets $500,000)
    const [res1] = await connection.query(
      `INSERT INTO ${personalSchema}.accounts (user_id, balance) VALUES (?, ?);`,
      [seedUsers[0].id, 0],
    );
    const [res2] = await connection.query(
      `INSERT INTO ${personalSchema}.accounts (user_id, balance) VALUES (?, ?);`,
      [seedUsers[1].id, 0],
    );
    const [res3] = await connection.query(
      `INSERT INTO ${businessSchema}.accounts (business_user_id, balance) VALUES (?, ?);`,
      [seedUsers[2].id, 500000],
    );

    console.log('DB setup complete');
  } catch (err) {
    console.error('DB setup failed', err.message || err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
