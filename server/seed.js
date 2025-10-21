const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const BASE = process.env.SERVER_BASE_URL || `http://localhost:${process.env.SERVER_PORT || 5000}`;
const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan'];

async function seed() {
  try {
    for (const name of names) {
      const email = `${name.toLowerCase()}@example.com`;
      const password =
        process.env.SEED_ADMIN_PASSWORD || require('crypto').randomBytes(8).toString('hex');
      // call signup
      console.log('Creating', email);
      await axios
        .post(`${BASE}/auth/signup`, { firstName: name, lastName: 'Demo', email, password })
        .catch(() => {});
    }
    console.log('Seed complete');
  } catch (e) {
    console.error('seed error', e.message || e);
  }
}

seed();
