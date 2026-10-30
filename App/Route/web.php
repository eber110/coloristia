<?php

use Core\Route;
use App\Controllers\HomeControllers;
use App\Controllers\AuthControllers;
use App\Controllers\ProjectControllers;
use App\Middleware\VisitMiddleware;

/**
 * Definición de rutas principales de Coloristia.
 */

// Rutas públicas con middleware de registro de visitas
Route::middleware([VisitMiddleware::class])->group(function () {
  Route::get("/", [HomeControllers::class, "home"]);
});

// Rutas de autenticación y preferencias
Route::prefix("/auth")->group(function () {
  Route::post("/login", [AuthControllers::class, "login"]);
  Route::post("/register", [AuthControllers::class, "register"]);
  Route::post("/logout", [AuthControllers::class, "logout"]);
  Route::get("/logout", [AuthControllers::class, "logout"]);
});

Route::post("/user/color-system", [AuthControllers::class, "updateColorSystem"]);

// Rutas de gestión de proyectos de paletas
Route::prefix("/projects")->group(function () {
  Route::post("/save", [ProjectControllers::class, "save"]);
  Route::get("/list", [ProjectControllers::class, "list"]);
  Route::post("/delete", [ProjectControllers::class, "delete"]);
});
