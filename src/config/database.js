const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const env = require('./env');

// Ensure data directory exists
const dbDir = path.dirname(env.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(env.DB_PATH);
    // Performance optimizations
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

const db = {
  get raw() {
    return getDb();
  },
  exec(sql) {
    return getDb().exec(sql);
  },
  prepare(sql) {
    return getDb().prepare(sql);
  },
  queryAll(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.all(...params);
  },
  queryOne(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.get(...params);
  },
  run(sql, params = []) {
    const stmt = getDb().prepare(sql);
    return stmt.run(...params);
  }
};

module.exports = db;
