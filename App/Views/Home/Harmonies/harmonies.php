<?php
/**
 * Chromatic harmony dashboard and project save panel.
 *
 * @var bool $isLoggedIn
 */
?>
<section class="harmonies-section">
  <div class="harmonies-header">
    <!-- Section title and harmony filter dropdown (Desktop & Tablet) -->
    <div class="harmonies-title-group flex-wrap no-phone">
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

    <!-- Mobile harmony selector: displays only one palette on smartphone (Smartphone only) -->
    <div class="mobile-harmony-bar no-desk no-tablet w100 flex-column gap6">
      <label for="mobileHarmonySelect" class="control-label">Armonía cromática:</label>
      <select id="mobileHarmonySelect" class="select-control w100" aria-label="Elegir armonía">
        <option value="monochromatic">Monocromática</option>
        <option value="complementary">Complementaria</option>
        <option value="analogousStandard">Análoga</option>
        <option value="triad">Tríada</option>
        <option value="splitComplementary">Complementaria Dividida</option>
        <option value="analogousExtended">Análoga Extendida</option>
        <option value="analogousAccented">Análoga Acentuada</option>
        <option value="tetradRectangular">Tétrada Rectangular</option>
        <option value="tetradSquare">Tétrada Cuadrada</option>
        <option value="pentagon">Pentágono</option>
        <option value="hexagon">Hexágono</option>
        <option value="goldenRatio">Proporción Áurea</option>
      </select>
    </div>

    <!-- Save Project Bar -->
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

  <!-- Dynamic chromatic harmony columns grid -->
  <div id="harmoniesGrid" class="harmonies-grid">
    <!-- Rendered via coloristiaApp.js -->
  </div>
</section>
