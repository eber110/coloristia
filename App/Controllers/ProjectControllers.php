<?php

namespace App\Controllers;

use Base\Control\Control;
use Base\Module\AuthModule;
use Base\Module\ResponseModule;
use Base\Module\SecurityModule;
use Base\Module\Session;
use App\Models\ProjectModels;
use App\Models\LogModels;

/**
 * Controlador para la gestión de proyectos de paletas cromáticas guardadas.
 */
class ProjectControllers extends Control
{
  /**
   * Guarda un nuevo proyecto con su color base.
   *
   * @return never
   */
  public function save(): never
  {
    Session::start();

    if (!AuthModule::check()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Debes iniciar sesión para guardar tus proyectos de color."
      ], 401);
    }

    if (!SecurityModule::verifyCsrf()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Token de seguridad inválido o expirado."
      ], 403);
    }

    $projectName = trim($_POST["project_name"] ?? "");
    $hexColor = trim($_POST["hex_color"] ?? "");

    if (empty($projectName)) {
      $projectName = "Paleta Base " . $hexColor;
    }

    if (!preg_match('/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $hexColor)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "El formato de color HEX no es válido."
      ], 422);
    }

    $userId = AuthModule::id();
    $projectId = ProjectModels::saveProject($userId, $projectName, $hexColor);

    if (!$projectId) {
      LogModels::record("error", "project.save_failed", "Fallo al guardar proyecto '{$projectName}'", null, $userId);
      ResponseModule::json([
        "status"  => "error",
        "message" => "Error al guardar el proyecto en la base de datos."
      ], 500);
    }

    LogModels::record("info", "project.saved", "Proyecto guardado: {$projectName} ({$hexColor})", null, $userId);

    $savedProject = ProjectModels::getById($projectId, $userId);

    ResponseModule::json([
      "status"  => "success",
      "message" => "¡Proyecto '{$projectName}' guardado correctamente!",
      "project" => $savedProject
    ]);
  }

  /**
   * Obtiene la lista de todos los proyectos del usuario activo.
   *
   * @return never
   */
  public function list(): never
  {
    Session::start();

    if (!AuthModule::check()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "No autenticado."
      ], 401);
    }

    $userId = AuthModule::id();
    $projects = ProjectModels::getByUserId($userId);

    ResponseModule::json([
      "status"   => "success",
      "projects" => $projects
    ]);
  }

  /**
   * Elimina un proyecto existente perteneciente al usuario.
   *
   * @return never
   */
  public function delete(): never
  {
    Session::start();

    if (!AuthModule::check()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Debes iniciar sesión para realizar esta acción."
      ], 401);
    }

    if (!SecurityModule::verifyCsrf()) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Token de seguridad inválido."
      ], 403);
    }

    $projectId = (int)($_POST["id"] ?? 0);
    if ($projectId <= 0) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "ID de proyecto inválido."
      ], 422);
    }

    $userId = AuthModule::id();
    $deleted = ProjectModels::deleteProject($projectId, $userId);

    if (!$deleted) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "No se pudo eliminar el proyecto o no tienes permisos."
      ], 404);
    }

    LogModels::record("info", "project.deleted", "Proyecto ID {$projectId} eliminado", null, $userId);

    ResponseModule::json([
      "status"  => "success",
      "message" => "Proyecto eliminado con éxito."
    ]);
  }
}
