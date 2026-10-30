<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Modelo para la gestión de proyectos y colores base de los usuarios.
 */
class ProjectModels extends Builder
{
  protected $table = "projects";

  /**
   * Guarda un nuevo proyecto con su color base en formato HEX.
   *
   * @param int|string $userId Identificador del usuario.
   * @param string $projectName Nombre del proyecto.
   * @param string $hexColor Color base en formato HEX (ej: #c42127).
   * @return int|string|false ID del proyecto creado o false si falló.
   */
  public static function saveProject(int|string $userId, string $projectName, string $hexColor): int|string|false
  {
    $instance = new self();
    $projectName = trim($projectName);
    $hexColor = strtoupper(trim($hexColor));

    if (!str_starts_with($hexColor, "#")) {
      $hexColor = "#" . $hexColor;
    }

    $insertData = [
      "user_id"      => (int)$userId,
      "project_name" => $projectName,
      "hex_color"    => $hexColor,
      "created_at"   => date("Y-m-d H:i:s")
    ];

    return $instance->create($insertData);
  }

  /**
   * Obtiene todos los proyectos pertenecientes a un usuario.
   *
   * @param int|string $userId Identificador del usuario.
   * @return array Lista de proyectos ordenados del más reciente al más antiguo.
   */
  public static function getByUserId(int|string $userId): array
  {
    $instance = new self();
    $results = $instance->select("*")
      ->where("user_id", (string)$userId)
      ->orderBy("id", "DESC")
      ->get();

    return is_array($results) ? $results : [];
  }

  /**
   * Obtiene un proyecto por su ID validando la pertenencia al usuario.
   *
   * @param int|string $id ID del proyecto.
   * @param int|string $userId ID del usuario.
   * @return array|null Datos del proyecto o null si no existe.
   */
  public static function getById(int|string $id, int|string $userId): ?array
  {
    $instance = new self();
    $result = $instance->select("*")
      ->where("id", (string)$id)
      ->where("user_id", (string)$userId)
      ->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Actualiza el nombre o color de un proyecto existente.
   *
   * @param int|string $id ID del proyecto.
   * @param int|string $userId ID del usuario.
   * @param string $projectName Nombre del proyecto.
   * @param string $hexColor Color en HEX.
   * @return bool True si se actualizó con éxito.
   */
  public static function updateProject(int|string $id, int|string $userId, string $projectName, string $hexColor): bool
  {
    $project = self::getById($id, $userId);
    if (!$project) {
      return false;
    }

    $hexColor = strtoupper(trim($hexColor));
    if (!str_starts_with($hexColor, "#")) {
      $hexColor = "#" . $hexColor;
    }

    $instance = new self();
    $instance->update("id", (string)$id, [
      "project_name" => trim($projectName),
      "hex_color"    => $hexColor,
      "updated_at"   => date("Y-m-d H:i:s")
    ]);

    return true;
  }

  /**
   * Elimina un proyecto si pertenece al usuario.
   *
   * @param int|string $id ID del proyecto.
   * @param int|string $userId ID del usuario propietario.
   * @return bool True si fue eliminado.
   */
  public static function deleteProject(int|string $id, int|string $userId): bool
  {
    $project = self::getById($id, $userId);
    if (!$project) {
      return false;
    }

    $instance = new self();
    $instance->delete("id", (string)$id);
    return true;
  }
}
