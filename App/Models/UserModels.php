<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Modelo para la gestión de usuarios y preferencias cromáticas.
 */
class UserModels extends Builder
{
  protected $table = "users";

  /**
   * Registra un nuevo usuario en la base de datos.
   *
   * @param array $data Datos del usuario (username, email, password, color_system)
   * @return int|string|false ID del usuario insertado o false en fallo.
   */
  public static function register(array $data): int|string|false
  {
    $instance = new self();
    $insertData = [
      "username"     => trim($data["username"]),
      "email"        => strtolower(trim($data["email"])),
      "password"     => $data["password"],
      "color_system" => $data["color_system"] ?? "hex",
      "status"       => "active",
      "created_at"   => date("Y-m-d H:i:s")
    ];

    return $instance->create($insertData);
  }

  /**
   * Busca un usuario por su identificador primario.
   *
   * @param int|string $id ID del usuario.
   * @return array|null Datos del usuario o null si no existe.
   */
  public static function findById(int|string $id): ?array
  {
    $instance = new self();
    $result = $instance->select()->where("id", (string)$id)->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Busca un usuario por su dirección de correo electrónico.
   *
   * @param string $email Correo electrónico del usuario.
   * @return array|null Datos del usuario o null si no existe.
   */
  public static function findByEmail(string $email): ?array
  {
    $instance = new self();
    $result = $instance->select()->where("email", strtolower(trim($email)))->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Busca un usuario por su nombre de usuario.
   *
   * @param string $username Nombre de usuario.
   * @return array|null Datos del usuario o null si no existe.
   */
  public static function findByUsername(string $username): ?array
  {
    $instance = new self();
    $result = $instance->select()->where("username", trim($username))->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Actualiza el sistema de color de preferencia del usuario.
   *
   * @param int|string $userId ID del usuario.
   * @param string $colorSystem Sistema preferido (hex, rgb, hsl, hsv, cmyk).
   * @return bool True si se actualizó correctamente.
   */
  public static function updateColorSystem(int|string $userId, string $colorSystem): bool
  {
    $validSystems = ["hex", "rgb", "hsl", "hsv", "cmyk"];
    $colorSystem = strtolower(trim($colorSystem));
    if (!in_array($colorSystem, $validSystems, true)) {
      $colorSystem = "hex";
    }

    $instance = new self();
    $instance->update("id", (string)$userId, [
      "color_system" => $colorSystem,
      "updated_at"   => date("Y-m-d H:i:s")
    ]);

    return true;
  }

  /**
   * Verifica si un correo electrónico ya está registrado.
   *
   * @param string $email Correo electrónico.
   * @return bool True si ya existe.
   */
  public static function emailExists(string $email): bool
  {
    return self::findByEmail($email) !== null;
  }

  /**
   * Verifica si un nombre de usuario ya está registrado.
   *
   * @param string $username Nombre de usuario.
   * @return bool True si ya existe.
   */
  public static function usernameExists(string $username): bool
  {
    return self::findByUsername($username) !== null;
  }
}
