<?php

namespace App\Middleware;

use App\Middleware\MiddlewareInterface\MiddlewareInterface;
use Base\Module\AuthModule;
use Base\Module\ResponseModule;
use Base\Module\Session;

/**
 * Middleware para asegurar que el usuario esté autenticado.
 */
class AuthMiddleware implements MiddlewareInterface
{
  /**
   * Valida sesión activa antes de proceder.
   *
   * @param mixed $requestData
   * @param callable $next
   * @return mixed
   */
  public function handle($requestData, callable $next)
  {
    Session::start();

    if (!AuthModule::check()) {
      $isAjax = (!empty($_SERVER["HTTP_X_REQUESTED_WITH"]) && strtolower($_SERVER["HTTP_X_REQUESTED_WITH"]) === "xmlhttprequest")
        || str_contains($_SERVER["HTTP_ACCEPT"] ?? "", "application/json");

      if ($isAjax) {
        return ResponseModule::json([
          "status"  => "error",
          "message" => "No autenticado. Por favor inicia sesión."
        ], 401);
      }

      return ResponseModule::redirect("/", "Inicia sesión para acceder.", 1);
    }

    return $next($requestData);
  }
}
