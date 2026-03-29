import { DatabaseSync } from 'node:sqlite';
import path from 'path';

let db: DatabaseSync;

function resolveDbPath(): string {

  const rawUrl = process.env.DATABASE_URL || '';

  // Ruta absoluta: file:/home/eberstud/coloralia/prisma/dev.db
  if (rawUrl.startsWith('file:/') && !rawUrl.startsWith('file:./') && !rawUrl.startsWith('file:../')) {
    return rawUrl.slice(5);
  }

  // Ruta relativa: file:./prisma/dev.db → resuelve desde el CWD del proceso
  const relativePart = rawUrl.startsWith('file:') ? rawUrl.slice(5) : './prisma/dev.db';
  return path.resolve(process.cwd(), relativePart);

}

export function getDb(): DatabaseSync {

  if (!db) {

    const dbPath = resolveDbPath();
    db = new DatabaseSync(dbPath);

    // Crear tablas si no existen (idempotente)
    db.exec(`
      CREATE TABLE IF NOT EXISTS User (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        email     TEXT    UNIQUE NOT NULL,
        password  TEXT    NOT NULL,
        role      TEXT    NOT NULL DEFAULT 'REGISTERED',
        createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS Palette (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT    NOT NULL,
        colors    TEXT    NOT NULL,
        userId    INTEGER NOT NULL,
        createdAt TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );
    `);

  }

  return db;

}
