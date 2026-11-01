<?php

namespace App\Controllers;

use Base\Control\Control;
use Base\Module\SeoModule;

/**
 * Controlador de SEO para generación dinámica de sitemap.xml, robots.txt y llms.txt.
 */
class SeoControllers extends Control
{
  /**
   * Genera y sirve el sitemap XML de la aplicación.
   *
   * @return void
   */
  public function sitemap(): void
  {
    $excludeRoutes = [
      "/autenticacion*",
      "/proyectos*",
      "/usuario*",
      "/sitemap.xml",
      "/robots.txt",
      "/llms.txt",
      "/test*"
    ];

    $routeOptions = [
      "/" => [
        "priority"   => 1.0,
        "changefreq" => "weekly",
        "lastmod"    => date("Y-m-d")
      ]
    ];

    SeoModule::sitemap($excludeRoutes, $routeOptions);
    exit;
  }

  /**
   * Genera y sirve el archivo robots.txt con directivas de indexación y enlace al sitemap.
   *
   * @return void
   */
  public function robots(): void
  {
    $disallow = [
      "/autenticacion/",
      "/proyectos/",
      "/usuario/"
    ];

    $allow = [
      "/",
      "/App/Public/"
    ];

    SeoModule::robots($disallow, $allow, "*", true);
  }

  /**
   * Genera y sirve el archivo llms.txt para consumo por agentes de IA y crawlers modernos.
   *
   * @return void
   */
  public function llms(): void
  {
    SeoModule::llms([
      "title"    => "Coloristia",
      "summary"  => "Generador profesional de paletas cromáticas armónicas y escalables de 6 a 16 colores con reglas geométricas y accesibilidad WCAG.",
      "details"  => "Coloristia es una suite cromática avanzada para diseñadores y desarrolladores. Permite calcular armonías matemáticas de color (análogas, complementarias, triadas, tétradas, monocromáticas y split), generar escalas tonales de contraste y exportar tokens en múltiples formatos (HEX, RGB, HSL, OKLCH, CSS, Tailwind y JSON).",
      "sections" => [
        "Herramientas y Navegación" => [
          [
            "title"       => "Generador de Paletas Coloristia",
            "url"         => "/",
            "description" => "Herramienta principal interactiva para formulación, balance y visualización de armonías cromáticas."
          ]
        ]
      ]
    ]);
  }
}
