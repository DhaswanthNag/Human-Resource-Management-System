require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

let isConnected = false;

pool.on("connect", () => {
  if (!isConnected) {
    isConnected = true;
    console.log("Connected to PostgreSQL");
  }
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

module.exports = pool;