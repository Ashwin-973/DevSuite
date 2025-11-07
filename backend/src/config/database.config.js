
export default {
  connectionString: process.env.DB_CONNECTION_STRING,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};