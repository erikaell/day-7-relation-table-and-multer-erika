const { Pool } = require('pg');

const dbPool = new Pool({
  database: 'personal_web',
  port: '5432',
  user: 'postgres',
  password: '121212',
});

module.exports = dbPool;