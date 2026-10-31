<?php

namespace App\Controllers;

use Base\Control\Control;
use Base\Module\AuthModule;
use Base\Module\CookieModule;
use Base\Module\ResponseModule;
use Base\Module\SecurityModule;
use Base\Module\Session;
use Base\Module\TokenModule;
use App\Models\UserModels;
use App\Models\LogModels;

/**
 * Controller for user authentication, registration, and color system preferences.
 */
class AuthControllers extends Control
{
  /**
   * Processes user login.
   *
   * @return never
   */
  public function login(): never
  {
    Session::start();

    if (!SecurityModule::verifyCsrf()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Token de seguridad inválido o expirado. Recarga la página."
      ], 403);
    }

    $identifier = trim($_POST["identifier"] ?? "");
    $password = $_POST["password"] ?? "";

    if (empty($identifier) || empty($password)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Debes ingresar tu usuario/correo y contraseña."
      ], 422);
    }

    $column = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? "email" : "username";
    $attempt = AuthModule::attempt($identifier, $password, "users", $column, "password");

    if (!$attempt) {
      LogModels::record("warning", "auth.failed", "Failed login attempt for identifier: {$identifier}");
      ResponseModule::json([
        "status"  => "error",
        "message" => "Credenciales incorrectas. Verifica tus datos."
      ], 401);
    }

    $user = AuthModule::user();
    $userId = AuthModule::id();
    $dbUser = UserModels::findById($userId);
    $colorSystem = $dbUser["color_system"] ?? "hex";

    if ($dbUser) {
      // Registrar sesión persistente con JWT firmado con la semilla SEED sin password
      Session::create_user_session($dbUser, ["password"]);
    } elseif (isset($_SESSION["user"])) {
      $_SESSION["user"]["color_system"] = $colorSystem;
    }

    $jwtUser = $dbUser;
    if (is_array($jwtUser)) {
      unset($jwtUser["password"]);
    }
    $jwtToken = (class_exists(TokenModule::class) && $jwtUser)
      ? TokenModule::configJWT($jwtUser)
      : null;

    LogModels::record("info", "auth.login", "User successfully authenticated: {$user['username']}", null, $userId);

    ResponseModule::json([
      "status"       => "success",
      "message"      => "¡Bienvenido de vuelta, " . ($user["username"] ?? "") . "!",
      "token"        => $jwtToken,
      "user"         => [
        "id"           => $userId,
        "username"     => $user["username"] ?? "",
        "email"        => $user["email"] ?? "",
        "color_system" => $colorSystem
      ],
      "color_system" => $colorSystem
    ]);
  }

  /**
   * Registers a new user account.
   *
   * @return never
   */
  public function register(): never
  {
    Session::start();

    if (!SecurityModule::verifyCsrf()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Token de seguridad inválido o expirado."
      ], 403);
    }

    $username = trim($_POST["username"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $password = $_POST["password"] ?? "";
    $colorSystem = strtolower(trim($_POST["color_system"] ?? "hex"));

    if (strlen($username) < 3) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "El nombre de usuario debe tener al menos 3 caracteres."
      ], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "El formato de correo electrónico no es válido."
      ], 422);
    }

    if (strlen($password) < 6) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "La contraseña debe contener al menos 6 caracteres."
      ], 422);
    }

    if (UserModels::usernameExists($username)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Ese nombre de usuario ya está en uso."
      ], 409);
    }

    if (UserModels::emailExists($email)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Ese correo electrónico ya está registrado."
      ], 409);
    }

    $validSystems = ["hex", "rgb", "hsl", "hsv", "cmyk"];
    if (!in_array($colorSystem, $validSystems, true)) {
      $colorSystem = "hex";
    }

    $passwordHash = AuthModule::hashPassword($password);

    $userId = UserModels::registerUser([
      "username"     => $username,
      "email"        => $email,
      "password"     => $passwordHash,
      "color_system" => $colorSystem
    ]);

    if (!$userId) {
      LogModels::record("error", "auth.register_error", "Failed to register user: {$username}");
      ResponseModule::json([
        "status"  => "error",
        "message" => "No se pudo completar el registro. Intenta nuevamente."
      ], 500);
    }

    // Iniciar sesión automáticamente y firmar JWT persistente
    AuthModule::loginUsingId($userId);
    $registeredUser = UserModels::findById($userId);
    if ($registeredUser) {
      Session::create_user_session($registeredUser, ["password"]);
    }

    $jwtRegUser = $registeredUser;
    if (is_array($jwtRegUser)) {
      unset($jwtRegUser["password"]);
    }
    $jwtToken = (class_exists(TokenModule::class) && $jwtRegUser)
      ? TokenModule::configJWT($jwtRegUser)
      : null;

    LogModels::record("info", "auth.register", "New user registered: {$username}", null, (int)$userId);

    ResponseModule::json([
      "status"       => "success",
      "message"      => "¡Cuenta creada exitosamente! Bienvenido, {$username}.",
      "token"        => $jwtToken,
      "user"         => [
        "id"           => (int)$userId,
        "username"     => $username,
        "email"        => $email,
        "color_system" => $colorSystem
      ],
      "color_system" => $colorSystem
    ]);
  }

  /**
   * Terminates active session.
   *
   * @return never
   */
  public function logout(): never
  {
    Session::start();

    if (AuthModule::check()) {
      $userId = AuthModule::id();
      LogModels::record("info", "auth.logout", "User logged out", null, $userId);
      AuthModule::logout();
    }

    Session::session_end_all();
    if (class_exists(CookieModule::class)) {
      CookieModule::delete("auth_token");
    }

    $isAjax = (!empty($_SERVER["HTTP_X_REQUESTED_WITH"]) && strtolower($_SERVER["HTTP_X_REQUESTED_WITH"]) === "xmlhttprequest")
      || str_contains($_SERVER["HTTP_ACCEPT"] ?? "", "application/json");

    if ($isAjax) {
      ResponseModule::json([
        "status"  => "success",
        "message" => "Sesión cerrada correctamente."
      ]);
    }

    ResponseModule::redirect("/", "Has cerrado sesión correctamente.", 0);
  }

  /**
   * Updates preferred color system for authenticated user.
   *
   * @return never
   */
  public function updateColorSystem(): never
  {
    Session::start();

    if (!AuthModule::check()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Debes iniciar sesión para guardar tus preferencias."
      ], 401);
    }

    if (!SecurityModule::verifyCsrf()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Token de seguridad inválido."
      ], 403);
    }

    $colorSystem = strtolower(trim($_POST["color_system"] ?? ""));
    $validSystems = ["hex", "rgb", "hsl", "hsv", "cmyk"];

    if (!in_array($colorSystem, $validSystems, true)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Sistema de color no soportado."
      ], 422);
    }

    $userId = AuthModule::id();
    UserModels::updateColorSystem($userId, $colorSystem);

    if (isset($_SESSION["user"])) {
      $_SESSION["user"]["color_system"] = $colorSystem;
    }

    ResponseModule::json([
      "status"       => "success",
      "message"      => "Preferencia de sistema de color actualizada.",
      "color_system" => $colorSystem
    ]);
  }
}
