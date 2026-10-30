<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Model for logging system events into the database.
 */
class LogModels extends Builder
{
  protected $table = "logs";

  /**
   * Records an event log in the database.
   *
   * @param string $level Severity level (info, warning, error, critical).
   * @param string $action Action key (e.g., auth.login, project.create).
   * @param string $message Explanatory message.
   * @param string|null $context Additional context data in JSON format.
   * @param int|null $userId Involved user ID if available.
   * @return int|string|false Inserted log ID or false on failure.
   */
  public static function record(
    string $level,
    string $action,
    string $message,
    ?string $context = null,
    ?int $userId = null
  ): int|string|false {
    $instance = new self();
    $data = [
      "level"      => $level,
      "action"     => $action,
      "message"    => $message,
      "context"    => $context,
      "user_id"    => $userId,
      "created_at" => date("Y-m-d H:i:s")
    ];

    return $instance->create($data);
  }

  /**
   * Retrieves recent logs.
   *
   * @param int $limit Maximum records to fetch.
   * @return array
   */
  public static function getRecent(int $limit = 50): array
  {
    $instance = new self();
    $results = $instance->select("*")
      ->orderBy("id", "DESC")
      ->limit($limit)
      ->get();

    return is_array($results) ? $results : [];
  }
}
