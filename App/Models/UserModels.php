<?php

namespace App\Models;

use Base\Builder\Builder;

/**
 * Model for user entity and color system preferences.
 */
class UserModels extends Builder
{
  protected $table = "users";

  /**
   * Registers a new user in the database.
   *
   * @param array $data User registration data (username, email, password, color_system).
   * @return int|string|false Inserted user ID or false on failure.
   */
  public static function registerUser(array $data): int|string|false
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
   * Finds a user by primary ID.
   *
   * @param int|string $id User ID.
   * @return array|null User record or null if not found.
   */
  public static function findById(int|string $id): ?array
  {
    $instance = new self();
    $result = $instance->select("*")->where("id", (string)$id)->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Finds a user by email address.
   *
   * @param string $email User email address.
   * @return array|null User record or null if not found.
   */
  public static function findByEmail(string $email): ?array
  {
    $instance = new self();
    $result = $instance->select("*")->where("email", strtolower(trim($email)))->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Finds a user by username.
   *
   * @param string $username Username string.
   * @return array|null User record or null if not found.
   */
  public static function findByUsername(string $username): ?array
  {
    $instance = new self();
    $result = $instance->select("*")->where("username", trim($username))->get_one();

    if ($result && isset($result[0]) && is_array($result[0])) {
      return $result[0];
    }
    return null;
  }

  /**
   * Updates user preferred color system.
   *
   * @param int|string $userId User ID.
   * @param string $colorSystem Preferred system (hex, rgb, hsl, hsv, cmyk).
   * @return bool True on success.
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
   * Checks whether an email address is already registered.
   *
   * @param string $email Email address to check.
   * @return bool True if already exists.
   */
  public static function emailExists(string $email): bool
  {
    return self::findByEmail($email) !== null;
  }

  /**
   * Checks whether a username is already taken.
   *
   * @param string $username Username to check.
   * @return bool True if already exists.
   */
  public static function usernameExists(string $username): bool
  {
    return self::findByUsername($username) !== null;
  }
}
