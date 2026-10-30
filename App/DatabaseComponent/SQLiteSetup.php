<?php

namespace App\DatabaseComponent;

use Core\Conexion;
use PDO;
use Exception;

/**
 * Clase para la inicialización y migración de tablas SQLite de Coloristia.
 */
class SQLiteSetup
{
  /**
   * Crea las tablas necesarias en la base de datos SQLite si no existen.
   *
   * @return array Resultado de la operación por cada tabla.
   */
  public static function setupTables(): array
  {
    $results = [];

    try {
      $conexion = new Conexion();
      $pdo = $conexion->getPdo();

      if (!$pdo) {
        return ["error" => "No se pudo obtener la conexión PDO a SQLite."];
      }

      // Habilitar llaves foráneas en SQLite
      $pdo->exec("PRAGMA foreign_keys = ON;");

      // 1. Tabla de Usuarios
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

      // 2. Tabla de Proyectos / Paletas guardadas
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

      // 3. Tabla de Registro de Visitas
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

      // 4. Tabla de Registro de Logs del sistema
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
