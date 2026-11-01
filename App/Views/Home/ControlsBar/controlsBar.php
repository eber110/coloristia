<?php
/**
 * Palette control and configuration bar (color system, variation stepper, quick swatches).
 *
 * @var string $colorSystem
 * @var bool $isLoggedIn
 */
?>
<section class="controls-panel">
  <!-- Top bar: Brand, Export and My Palettes buttons -->
  <div class="controls-top-bar">
    <span class="brand-title no-phone">Coloristia</span>
    <div class="flex-row gap10 items-center">
      <button type="button" id="openExportModalBtn" class="btn btn-outline btn-export" title="Exportar paleta en CSS, Tailwind o JSON">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <span>Exportar</span>
      </button>
      <button type="button" id="openProjectsModalBtn" class="btn btn-outline btn-my-palettes">
        Mis Paletas
      </button>
    </div>
  </div>

  <!-- Bottom controls row: labels on top, inputs and action buttons aligned at the bottom -->
  <div class="controls-actions-row">
    <!-- Color System Selector -->
    <div class="control-group-vertical">
      <label for="colorSystemSelect" class="control-label">Sistema de color:</label>
      <select id="colorSystemSelect" class="select-control">
        <option value="hex" <?= $colorSystem === 'hex' ? 'selected' : '' ?>>HEX</option>
        <option value="rgb" <?= $colorSystem === 'rgb' ? 'selected' : '' ?>>RGB</option>
        <option value="hsl" <?= $colorSystem === 'hsl' ? 'selected' : '' ?>>HSL</option>
        <option value="hsv" <?= $colorSystem === 'hsv' ? 'selected' : '' ?>>HSV</option>
        <option value="cmyk" <?= $colorSystem === 'cmyk' ? 'selected' : '' ?>>CMYK</option>
      </select>
    </div>

    <!-- Variations Stepper (6 to 15) -->
    <div class="control-group-vertical">
      <span id="variationsLabel" class="control-label">Variaciones (6-15):</span>
      <div class="stepper-box" role="group" aria-labelledby="variationsLabel">
        <button type="button" id="decreaseVariationsBtn" class="stepper-btn" aria-label="Disminuir variaciones">−</button>
        <span id="variationCountDisplay" class="stepper-value font-mono" aria-live="polite">15</span>
        <button type="button" id="increaseVariationsBtn" class="stepper-btn" aria-label="Aumentar variaciones">+</button>
      </div>
    </div>

    <!-- Quick Action Buttons -->
    <div class="control-buttons-group">
      <!-- Hidden quick trigger for script compatibility -->
      <button type="button" id="quickColorTrigger" class="color-circle-btn" title="Seleccionar color base" style="display: none;" aria-label="Seleccionar color base"></button>

      <button type="button" id="randomColorBtn" class="icon-btn" title="Generar color aleatorio (Espacio)" aria-label="Aleatorio">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </button>

      <button type="button" id="clearPinnedBtn" class="btn-clear-colors" title="Borrar colores de referencia" aria-label="Borrar colores" style="display: none;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Borrar colores</span>
      </button>
    </div>
  </div>
</section>
