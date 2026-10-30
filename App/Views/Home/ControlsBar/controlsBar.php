<?php
/**
 * Palette control and configuration bar (color system, variation stepper, quick swatches).
 *
 * @var string $colorSystem
 * @var bool $isLoggedIn
 */
?>
<section class="controls-panel">
  <div class="controls-header">
    <!-- Brand title and Color System selector -->
    <div class="flex-row items-center gap20 flex-wrap">
      <span class="brand-title">Coloristia</span>

      <div class="control-group">
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
      <div class="control-group">
        <label class="control-label">Variaciones (6-15):</label>
        <div class="stepper-box">
          <button type="button" id="decreaseVariationsBtn" class="stepper-btn" aria-label="Disminuir variaciones">−</button>
          <span id="variationCountDisplay" class="stepper-value font-mono">15</span>
          <button type="button" id="increaseVariationsBtn" class="stepper-btn" aria-label="Aumentar variaciones">+</button>
        </div>
      </div>

      <!-- Quick Color Actions -->
      <div class="control-group items-center gap10">
        <button type="button" id="quickColorTrigger" class="color-circle-btn" title="Seleccionar color base" style="background-color: #C42127;" aria-label="Seleccionar color base"></button>

        <button type="button" id="pinColorBtn" class="btn-pin-color" title="Fijar color actual como referencia" aria-label="Fijar color">+</button>

        <button type="button" id="randomColorBtn" class="icon-btn" title="Generar color aleatorio" aria-label="Aleatorio">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>

        <button type="button" id="clearPinnedBtn" class="btn-clear-colors" title="Borrar colores de referencia" aria-label="Borrar colores">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Borrar colores</span>
        </button>
      </div>
    </div>

    <!-- My Palettes Button -->
    <div>
      <button type="button" id="openProjectsModalBtn" class="btn btn-outline" style="border-radius: 8px; font-weight: 600; padding: 8px 16px;">
        Mis Paletas
      </button>
    </div>
  </div>
</section>
