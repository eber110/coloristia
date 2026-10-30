<?php

namespace App\Middleware;

use App\Middleware\MiddlewareInterface\MiddlewareInterface;
use App\Models\VisitModels;
use Base\Module\GeoLocation;

/**
 * Middleware para auditar y registrar las visitas a la plataforma.
 */
class VisitMiddleware implements MiddlewareInterface
{
  /**
   * Procesa la solicitud entrante y registra la visita.
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

    // Evitar registrar llamadas a recursos estáticos comunes si pasaran por index
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
        // Fallback silencioso si el servicio GeoIp no responde
      }

      VisitModels::recordVisit($ip, $userAgent, $uri, $country, $city);
    }

    return $next($requestData);
  }
}
