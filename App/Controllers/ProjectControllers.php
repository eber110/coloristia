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
 * Controller for managing saved color palette projects.
 */
class ProjectControllers extends Control
{
  /**
   * Saves a new project with its base color.
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
      LogModels::record("error", "project.save_failed", "Failed to save project '{$projectName}'", null, $userId);
      ResponseModule::json([
        "status"  => "error",
        "message" => "Error al guardar el proyecto en la base de datos."
      ], 500);
    }

    LogModels::record("info", "project.saved", "Project saved: {$projectName} ({$hexColor})", null, $userId);

    $savedProject = ProjectModels::getById($projectId, $userId);

    ResponseModule::json([
      "status"  => "success",
      "message" => "¡Proyecto '{$projectName}' guardado correctamente!",
      "project" => $savedProject
    ]);
  }

  /**
   * Returns list of projects belonging to the active user.
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
   * Updates a project's name.
   *
   * @return never
   */
  public function rename(): never
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
    $newName = trim($_POST["project_name"] ?? "");

    if ($projectId <= 0 || empty($newName)) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Datos inválidos para actualizar el nombre."
      ], 422);
    }

    $userId = AuthModule::id();
    $project = ProjectModels::getById($projectId, $userId);

    if (!$project) {
      ResponseModule::json([
        "status"  => "error",
        "message" => "Proyecto no encontrado."
      ], 404);
    }

    ProjectModels::updateProject($projectId, $userId, $newName, $project["hex_color"]);
    LogModels::record("info", "project.renamed", "Project ID {$projectId} renamed to {$newName}", null, $userId);

    ResponseModule::json([
      "status"  => "success",
      "message" => "Nombre de paleta actualizado correctamente.",
      "project_name" => $newName
    ]);
  }

  /**
   * Deletes a project owned by the active user.
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

    LogModels::record("info", "project.deleted", "Project ID {$projectId} deleted", null, $userId);

    ResponseModule::json([
      "status"  => "success",
      "message" => "Proyecto eliminado con éxito."
    ]);
  }
}
