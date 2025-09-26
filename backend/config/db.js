require("dotenv").config();
const { Pool } = require("pg");


const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { 
    require: true,
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("Connected to Render PostgreSQL"))
  .catch(err => console.error("Connection error", err));

module.exports = pool;

