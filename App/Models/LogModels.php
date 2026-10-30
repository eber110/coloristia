<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Modelo para el registro de eventos y logs en base de datos.
 */
class LogModels extends Builder
{
  protected $table = "logs";

  /**
   * Registra un log en la base de datos.
   *
   * @param string $level Nivel de severidad (info, warning, error, critical).
   * @param string $action Acción ejecutada (ej: auth.login, project.create).
   * @param string $message Mensaje explicativo.
   * @param string|null $context Datos adicionales serializados en JSON.
   * @param int|null $userId ID del usuario involucrado, si aplica.
   * @return int|string|false ID del log insertado o false en fallo.
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
   * Obtiene los logs más recientes.
   *
   * @param int $limit Límite de registros a recuperar.
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
