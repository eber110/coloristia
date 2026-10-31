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

  <!-- Card de Colores de Texto Armónicos (Muestra el color más claro y el más oscuro de la paleta elegida) -->
  <div id="paletteTextColorsCard" class="palette-text-card">
    <div class="palette-text-card-header">
      <div class="palette-text-card-title-group">
        <span class="palette-text-badge-icon">
          <?= svg("font", "icon-sm textw") ?>
        </span>
        <div>
          <h3 class="palette-text-card-title">Colores de Texto y Fondo Armónicos</h3>
          <p class="palette-text-card-subtitle">
            El tono más claro y más oscuro de la paleta elegida aplicados como fondo y texto de alto contraste.
          </p>
        </div>
      </div>

      <div class="palette-text-harmony-picker">
        <label for="textColorHarmonySelect" class="palette-text-picker-label">Armonía:</label>
        <select id="textColorHarmonySelect" class="select-control" aria-label="Elegir armonía para texto">
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
    </div>

    <div class="palette-text-card-body">
      <!-- Dark Text (para fondos claros) -->
      <div class="palette-text-sample-block is-dark-sample" id="darkTextSampleBlock">
        <div class="palette-text-sample-header">
          <div class="palette-text-role">
            <span class="palette-text-dot" id="darkTextDot"></span>
            <span class="palette-text-role-name">Texto Oscuro</span>
            <span class="palette-text-role-badge">Sobre fondo claro de paleta</span>
          </div>
          <button type="button" class="palette-text-copy-btn" id="copyDarkTextBtn" title="Copiar código de color">
            <span class="palette-text-color-value font-mono" id="darkTextColorValue">#000000</span>
            <span class="palette-text-copy-hint">Copiar</span>
          </button>
        </div>

        <div class="palette-text-preview-box is-light-surface" id="darkTextPreviewSurface">
          <div class="palette-text-preview-heading" id="darkTextHeading">
            Aa Tipografía Principal
          </div>
          <div class="palette-text-preview-body" id="darkTextBody">
            Diseñado con el tono más oscuro de la paleta para lectura nítida sobre el fondo más claro de la misma paleta.
          </div>
          <div class="palette-text-preview-footer">
            <span class="palette-text-ratio-badge is-wcag-pass" id="darkTextWcagBadge">15.2:1 AAA</span>
            <span class="palette-text-ratio-label" id="darkTextRatioLabel">Contraste fondo claro vs texto oscuro</span>
          </div>
        </div>
      </div>

      <!-- Light Text (para fondos oscuros) -->
      <div class="palette-text-sample-block is-light-sample" id="lightTextSampleBlock">
        <div class="palette-text-sample-header">
          <div class="palette-text-role">
            <span class="palette-text-dot" id="lightTextDot"></span>
            <span class="palette-text-role-name">Texto Claro</span>
            <span class="palette-text-role-badge">Sobre fondo oscuro de paleta</span>
          </div>
          <button type="button" class="palette-text-copy-btn" id="copyLightTextBtn" title="Copiar código de color">
            <span class="palette-text-color-value font-mono" id="lightTextColorValue">#FFFFFF</span>
            <span class="palette-text-copy-hint">Copiar</span>
          </button>
        </div>

        <div class="palette-text-preview-box is-dark-surface" id="lightTextPreviewSurface">
          <div class="palette-text-preview-heading" id="lightTextHeading">
            Aa Tipografía Principal
          </div>
          <div class="palette-text-preview-body" id="lightTextBody">
            Diseñado con el tono más claro de la paleta para lectura nítida sobre el fondo más oscuro de la misma paleta.
          </div>
          <div class="palette-text-preview-footer">
            <span class="palette-text-ratio-badge is-wcag-pass" id="lightTextWcagBadge">15.2:1 AAA</span>
            <span class="palette-text-ratio-label" id="lightTextRatioLabel">Contraste fondo oscuro vs texto claro</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dynamic chromatic harmony columns grid -->
  <div id="harmoniesGrid" class="harmonies-grid">
    <!-- Rendered via coloristiaApp.js -->
  </div>
</section>
