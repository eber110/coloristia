<?php

namespace App\DatabaseComponent;

use Core\Conexion;
use PDO;
use Exception;

/**
 * Setup and schema migration utility for Coloristia SQLite database.
 */
class SQLiteSetup
{
  /**
   * Creates required database tables in SQLite if they do not exist.
   *
   * @return array Status of setup operations per table.
   */
  public static function setupTables(): array
  {
    $results = [];

    try {
      $conexion = new Conexion();
      $pdo = $conexion->getPdo();

      if (!$pdo) {
        return ["error" => "Could not obtain PDO connection for SQLite."];
      }

      // Enable foreign keys constraint enforcement in SQLite
      $pdo->exec("PRAGMA foreign_keys = ON;");

      // 1. Users table
      $sqlUsers = "CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        color_system TEXT NOT NULL DEFAULT 'hex',
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      );";
      $pdo->exec($sqlUsers);
      $results["users"] = "OK";

      // 2. Saved palette projects table
      $sqlProjects = "CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_name TEXT NOT NULL,
        hex_color TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );";
      $pdo->exec($sqlProjects);
      $results["projects"] = "OK";

      // 3. Platform visits audit table
      $sqlVisits = "CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        page TEXT DEFAULT NULL,
        country TEXT DEFAULT NULL,
        city TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );";
      $pdo->exec($sqlVisits);
      $results["visits"] = "OK";

      // 4. System event logs table
      $sqlLogs = "CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL DEFAULT 'info',
        action TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT DEFAULT NULL,
        user_id INTEGER DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );";
      $pdo->exec($sqlLogs);
      $results["logs"] = "OK";

    } catch (Exception $e) {
      $results["exception"] = $e->getMessage();
    }

    return $results;
  }
}
