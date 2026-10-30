<?php

namespace App\Middleware;

use App\Middleware\MiddlewareInterface\MiddlewareInterface;
use App\Models\VisitModels;
use Base\Module\GeoLocation;

/**
 * Middleware for tracking and auditing platform visits.
 */
class VisitMiddleware implements MiddlewareInterface
{
  /**
   * Processes the incoming request and records visit details.
   *
   * @param mixed $requestData
   * @param callable $next
   * @return mixed
   */
  public function handle($requestData, callable $next)
  {
    $ip = $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1";
    $userAgent = $_SERVER["HTTP_USER_AGENT"] ?? null;
    $uri = $_SERVER["REQUEST_URI"] ?? "/";

    // Avoid logging static asset requests if dispatched through index
    if (!preg_match('/\.(css|js|png|jpg|jpeg|svg|ico|woff2|woff)$/i', $uri)) {
      $country = null;
      $city = null;

      try {
        if (!GeoLocation::isLocalIp($ip)) {
          $geo = GeoLocation::resolve($ip);
          $country = $geo["country"] ?? null;
          $city = $geo["city"] ?? null;
        }
      } catch (\Throwable $t) {
        // Silent fallback if GeoLocation lookup fails
      }

      VisitModels::recordVisit($ip, $userAgent, $uri, $country, $city);
    }

    return $next($requestData);
  }
}
