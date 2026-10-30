<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Modelo para el registro y auditoría de visitas a la aplicación.
 */
class VisitModels extends Builder
{
  protected $table = "visits";

  /**
   * Registra una visita en la base de datos.
   *
   * @param string|null $ip Dirección IP del visitante.
   * @param string|null $userAgent Navegador o cliente HTTP.
   * @param string|null $page Ruta o recurso solicitado.
   * @param string|null $country País resuelto por GeoIP.
   * @param string|null $city Ciudad resuelta por GeoIP.
   * @return int|string|false ID de la visita o false en fallo.
   */
  public static function recordVisit(
    ?string $ip = null,
    ?string $userAgent = null,
    ?string $page = null,
    ?string $country = null,
    ?string $city = null
  ): int|string|false {
    $instance = new self();
    $data = [
      "ip"         => $ip ?? ($_SERVER["REMOTE_ADDR"] ?? "127.0.0.1"),
      "user_agent" => substr($userAgent ?? ($_SERVER["HTTP_USER_AGENT"] ?? "Unknown"), 0, 255),
      "page"       => substr($page ?? ($_SERVER["REQUEST_URI"] ?? "/"), 0, 255),
      "country"    => $country,
      "city"       => $city,
      "created_at" => date("Y-m-d H:i:s")
    ];

    return $instance->create($data);
  }

  /**
   * Obtiene las visitas más recientes.
   *
   * @param int $limit Límite de registros.
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
