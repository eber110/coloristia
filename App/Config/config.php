<?php

/**
 * Configuración de la aplicación.
 * Este archivo carga las variables de entorno y la configuración del framework.
 */

use Dotenv\Dotenv;

// Ruta base del proyecto
$basePath = dirname(__DIR__, 2);

// Intentar cargar .env desde la raíz del proyecto
if (file_exists($basePath . '/.env')) {
    $dotenv = Dotenv::createImmutable($basePath);
    $dotenv->load();
}
// Si no existe en la raíz, intentar desde el framework
elseif (file_exists($basePath . '/vendor/eber/framework/.env')) {
    $dotenv = Dotenv::createImmutable($basePath . '/vendor/eber/framework');
    $dotenv->load();
}

// Cargar configuración del framework
if (file_exists($basePath . '/vendor/eber/framework/config.php')) {
    require_once $basePath . '/vendor/eber/framework/config.php';
} elseif (file_exists($basePath . '/config.php')) {
    require_once $basePath . '/config.php';
}

// ==================== ASSET VERSIONING & CACHE BUSTING ====================
if (!defined('ASSET_VERSION')) {
    $envVersion = $_ENV['ASSET_VERSION'] ?? $_ENV['APP_VERSION'] ?? 'auto';
    if ($envVersion === 'auto' || empty($envVersion)) {
        // Cálculo automático basado en la última fecha de modificación de los estilos
        $cssBase = $basePath . '/App/Public/Css/';
        $minCssFile = $basePath . '/App/Public/Min/Css/css.min.css';
        $maxMtime = file_exists($minCssFile) ? (int)filemtime($minCssFile) : 1;

        if (is_dir($cssBase)) {
            $cssFiles = @scandir($cssBase) ?: [];
            foreach ($cssFiles as $f) {
                if (str_ends_with($f, '.css')) {
                    $mtime = (int)@filemtime($cssBase . $f);
                    if ($mtime > $maxMtime) {
                        $maxMtime = $mtime;
                    }
                }
            }
        }
        define('ASSET_VERSION', (string)$maxMtime);
    } else {
        define('ASSET_VERSION', (string)$envVersion);
    }
}

