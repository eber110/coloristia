<?php

namespace App\Controllers;

use Base\Control\Control;
use Base\Module\AuthModule;
use Base\Module\SeoModule;
use Base\Module\Session;
use App\Models\UserModels;

/**
 * Main application controller for Coloristia.
 */
class HomeControllers extends Control
{
  /**
   * Renders the home view with user data.
   *
   * @return void
   */
  public function home()
  {
    Session::start();

    $isLoggedIn = AuthModule::check();
    $user = null;
    $colorSystem = "hex";

    if ($isLoggedIn) {
      $user = AuthModule::user();
      $userId = AuthModule::id();

      if ($userId) {
        $dbUser = UserModels::findById($userId);
        if ($dbUser) {
          unset($dbUser["password"]);
          $user = array_merge($user, $dbUser);
          $colorSystem = $dbUser["color_system"] ?? "hex";
        }
      }
    }

    SeoModule::setTitle("Coloristia — Generador Profesional de Paletas Cromáticas");
    SeoModule::setMetaDescription("Generador profesional de paletas cromáticas armónicas y escalables de 6 a 16 colores con reglas geométricas y accesibilidad WCAG.");

    SeoModule::setOpenGraph([
      "site_name"    => "Coloristia",
      "title"        => "Coloristia — Generador Profesional de Paletas Cromáticas",
      "description"  => "Generador profesional de paletas cromáticas armónicas y escalables de 6 a 16 colores con reglas geométricas y accesibilidad WCAG.",
      "type"         => "website",
      "image"        => IMG_OG,
      "image_width"  => 1200,
      "image_height" => 630,
      "link"         => defined("DOMAIN") ? DOMAIN : "/",
      "locale"       => "es_CL"
    ]);

    return $this->view("Home.home", [
      "user"        => $user,
      "isLoggedIn"  => $isLoggedIn,
      "colorSystem" => $colorSystem
    ]);
  }
}
