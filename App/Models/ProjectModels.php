<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Model for user color projects and base seed colors.
 */
class ProjectModels extends Builder
{
  protected $table = "projects";

  /**
   * Saves a new project record with its base HEX color.
   *
   * @param int|string $userId User identifier.
   * @param string $projectName Project name.
   * @param string $hexColor Base color in HEX format (e.g., #C42127).
   * @return int|string|false Created project ID or false on failure.
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
   * Retrieves all projects for a specific user.
   *
   * @param int|string $userId User identifier.
   * @return array List of projects sorted by ID descending.
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
   * Retrieves a single project by ID verifying user ownership.
   *
   * @param int|string $id Project ID.
   * @param int|string $userId User ID.
   * @return array|null Project record or null if not found.
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
   * Updates an existing project's name or base color.
   *
   * @param int|string $id Project ID.
   * @param int|string $userId User ID.
   * @param string $projectName Project name.
   * @param string $hexColor Base HEX color.
   * @return bool True on success.
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
   * Deletes a project owned by the user.
   *
   * @param int|string $id Project ID.
   * @param int|string $userId User ID.
   * @return bool True if deleted successfully.
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
