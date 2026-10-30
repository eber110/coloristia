<?php

use Core\Route;
use App\Controllers\HomeControllers;
use App\Controllers\AuthControllers;
use App\Controllers\ProjectControllers;
use App\Middleware\VisitMiddleware;

/**
 * Main route definitions for Coloristia.
 */

// Public routes with visit tracking middleware
Route::middleware([VisitMiddleware::class])->group(function () {
  Route::get("/", [HomeControllers::class, "home"]);
});

// Authentication and user preferences routes
Route::prefix("/autenticacion")->group(function () {
  Route::post("/ingresar", [AuthControllers::class, "login"]);
  Route::post("/registro", [AuthControllers::class, "register"]);
  Route::post("/salir", [AuthControllers::class, "logout"]);
  Route::get("/salir", [AuthControllers::class, "logout"]);
});

Route::post("/usuario/sistema-color", [AuthControllers::class, "updateColorSystem"]);

// Color project management routes
Route::prefix("/proyectos")->group(function () {
  Route::post("/guardar", [ProjectControllers::class, "save"]);
  Route::get("/listar", [ProjectControllers::class, "list"]);
  Route::post("/eliminar", [ProjectControllers::class, "delete"]);
});
