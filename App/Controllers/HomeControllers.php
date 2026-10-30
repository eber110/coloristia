<?php

namespace App\Controllers;

use Base\Control\Control;
use Base\Module\AuthModule;
use Base\Module\SeoModule;
use Base\Module\Session;
use App\Models\ProjectModels;
use App\Models\UserModels;

/**
 * Controlador principal para la vista de Coloristia.
 */
class HomeControllers extends Control
{
  /**
   * Renderiza la página principal de la aplicación.
   *
   * @return void
   */
  public function home()
  {
    Session::start();

    $isLoggedIn = AuthModule::check();
    $user = null;
    $projects = [];
    $colorSystem = "hex";

    if ($isLoggedIn) {
      $user = AuthModule::user();
      $userId = AuthModule::id();

      if ($userId) {
        $dbUser = UserModels::findById($userId);
        if ($dbUser) {
          $user = array_merge($user, $dbUser);
          $colorSystem = $dbUser["color_system"] ?? "hex";
        }
        $projects = ProjectModels::getByUserId($userId);
      }
    }

    SeoModule::setTitle("Coloristia — Generador Profesional de Paletas Cromáticas");
    SeoModule::setMetaDescription("Generador profesional de paletas cromáticas armónicas y escalables de 6 a 16 colores con reglas geométricas y accesibilidad WCAG.");

    return $this->view("Home.home", [
      "user"        => $user,
      "projects"    => $projects,
      "isLoggedIn"  => $isLoggedIn,
      "colorSystem" => $colorSystem
    ]);
  }
}
