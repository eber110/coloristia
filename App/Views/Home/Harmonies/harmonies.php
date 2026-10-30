<?php
/**
 * Tablero de combinaciones cromáticas y guardado de proyectos.
 *
 * @var bool $isLoggedIn
 */
?>
<section class="harmonies-section">
  <div class="harmonies-header">
    <!-- Título y selector de vista -->
    <div class="harmonies-title-group flex-wrap">
      <h2 class="harmonies-title">
        Combinaciones (Base: <span id="baseColorLabel" class="font-mono" style="color: var(--color-primary-brand);">#C42127</span>)
      </h2>

      <div style="margin-left: 14px;">
        <select id="harmoniesFilterSelect" class="select-control" style="padding: 6px 12px; font-size: 0.8rem;">
          <option value="primary">5 Armonías Principales</option>
          <option value="all">Todas las 12 Armonías</option>
          <option value="extra">Armonías Extendidas y Áurea</option>
        </select>
      </div>
    </div>

    <!-- Barra de Guardar Proyecto -->
    <div class="save-project-bar flex-wrap">
      <input
        type="text"
        id="projectNameInput"
        class="input-control"
        placeholder="Nombre del proyecto"
        data-auto="true"
        aria-label="Nombre del proyecto"
      >
      <button type="button" id="saveProjectBtn" class="btn-primary">
        Guardar
      </button>
    </div>
  </div>

  <!-- Rejilla interactiva de columnas cromáticas -->
  <div id="harmoniesGrid" class="harmonies-grid">
    <!-- Renderizado dinámico vía coloristiaApp.js -->
  </div>
</section>
