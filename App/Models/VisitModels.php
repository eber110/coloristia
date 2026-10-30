<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Model for recording and auditing platform visits.
 */
class VisitModels extends Builder
{
  protected $table = "visits";

  /**
   * Records a user visit in the database.
   *
   * @param string|null $ip Visitor IP address.
   * @param string|null $userAgent Visitor HTTP client/agent string.
   * @param string|null $page Requested URL path.
   * @param string|null $country Country resolved via GeoIP.
   * @param string|null $city City resolved via GeoIP.
   * @return int|string|false Inserted visit ID or false on failure.
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
   * Retrieves recent visits.
   *
   * @param int $limit Maximum number of records.
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
