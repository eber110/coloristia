<?php

namespace App\Middleware;

use App\Middleware\MiddlewareInterface\MiddlewareInterface;
use App\Models\UserModels;
use Base\Module\AuthModule;
use Base\Module\ResponseModule;
use Base\Module\Session;
use Base\Module\TokenModule;

/**
 * Middleware que garantiza que el cliente cuente con una sesión activa o token JWT válido.
 */
class AuthMiddleware implements MiddlewareInterface
{
  /**
   * Valida la sesión activa o token JWT antes de transferir la petición al siguiente handler.
   *
   * @param mixed $requestData
   * @param callable $next
   * @return mixed
   */
  public function handle($requestData, callable $next)
  {
    Session::start();

    // Si la sesión no está activa en $_SESSION ni por cookie auth_token, intentar validar Bearer Token JWT
    if (!AuthModule::check()) {
      $authHeader = $_SERVER["HTTP_AUTHORIZATION"] ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? "";
      if (empty($authHeader) && function_exists("apache_request_headers")) {
        $headers = apache_request_headers();
        $authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? "";
      }

      if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = $matches[1];
        if (class_exists(TokenModule::class)) {
          $userData = TokenModule::validateJWT($token);
          if ($userData && is_array($userData)) {
            $status = $userData["user_status"] ?? $userData["status"] ?? "";
            if (in_array($status, ["active", "1", 1, true], true) || empty($status)) {
              $userId = $userData["id"] ?? $userData["user_id"] ?? null;
              if ($userId) {
                $dbUser = UserModels::findById($userId);
                if ($dbUser && in_array($dbUser["status"] ?? "", ["active", "1", 1, true], true)) {
                  $_SESSION["user"] = $dbUser;
                }
              }
            }
          }
        }
      }
    }

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
