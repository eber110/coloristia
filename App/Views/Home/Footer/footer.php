<?php
/**
 * Official footer component for Coloristia.
 */
?>
<footer class="coloristia-footer">
  <div class="coloristia-container">
    <div class="footer-grid">
      <!-- Column 1: Brand & description -->
      <div class="flex-column gap12">
        <span class="brand-title" style="font-size: 1.15rem;">Coloristia</span>
        <p class="text-xs text-muted" style="line-height: 1.6; max-width: 360px; margin: 0;">
          Herramienta profesional de generación de paletas cromáticas impulsada por la pasión del diseño y la tecnología. Desarrollada por Eber Sánchez Cornejo.
        </p>
      </div>

      <!-- Column 2: Quick Links -->
      <div class="flex-column gap10">
        <span class="text-xs font-bold text-white uppercase tracking-wider">Enlaces Rápidos</span>
        <div class="flex-column gap8 text-xs text-muted">
          <a href="https://ebersanchez.cl" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">Sitio Web Oficial</a>
          <a href="https://ebersanchez.cl/portafolio" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">Portafolio Profesional</a>
          <a href="https://github.com/eber110" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">GitHub (eber110)</a>
        </div>
      </div>

      <!-- Column 3: Contact & Copyright -->
      <div class="flex-column gap10">
        <span class="text-xs font-bold text-white uppercase tracking-wider">Contacto</span>
        <div class="flex-column gap8 text-xs text-muted">
          <a href="mailto:contacto@ebersanchez.cl" class="hover:text-white transition">contacto@ebersanchez.cl</a>
          <span class="text-dim">Eber Sánchez Cornejo. &copy; <?= date("Y") ?></span>
        </div>
      </div>
    </div>
  </div>
</footer>
