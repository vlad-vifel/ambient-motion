import path from 'path';
import sqlite3 from 'sqlite3';

const dbPath = path.join(__dirname, '../../ambient_motion.db');

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✓ SQLite database connected');
        initializeSchema();
    }
});

db.run('PRAGMA foreign_keys = ON');

function initializeSchema() {
    db.serialize(() => {
        db.run(`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS Asset (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS Audio (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        duration REAL DEFAULT 0,
        url TEXT NOT NULL,
        uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS Video (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        phrase TEXT NOT NULL,
        status TEXT DEFAULT 'QUEUED',
        videoUrl TEXT,
        thumbnailUrl TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    });
}

export default db;
