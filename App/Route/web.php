<?php

use Core\Route;
use App\Controllers\HomeControllers;
use App\Controllers\AuthControllers;
use App\Controllers\ProjectControllers;
use App\Controllers\SeoControllers;
use App\Middleware\VisitMiddleware;

/**
 * Main route definitions for Coloristia.
 */

// Public routes with visit tracking middleware
Route::middleware([VisitMiddleware::class])->group(function () {
  Route::get("/", [HomeControllers::class, "home"]);
});

// SEO, sitemap and crawler directive routes
Route::get("/sitemap.xml", [SeoControllers::class, "sitemap"]);
Route::get("/robots.txt", [SeoControllers::class, "robots"]);
Route::get("/llms.txt", [SeoControllers::class, "llms"]);

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
  Route::post("/renombrar", [ProjectControllers::class, "rename"]);
  Route::post("/eliminar", [ProjectControllers::class, "delete"]);
});
