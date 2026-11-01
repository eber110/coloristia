<?php
/**
 * Center seed color display with interactive badge and custom color picker popover.
 */
?>
<section class="hero-seed-container">
  <div id="heroSeedsTrack" class="hero-seeds-track">
    <!-- Base / Default Working Color Circle (Always visible, changes on refresh or random) -->
    <div id="heroDefaultSeedItem" class="hero-seed-item">
      <button type="button" id="heroColorSwatch" class="hero-color-circle" title="Haz clic para abrir el selector de color" aria-label="Abrir selector de color base" style="background-color: #C42127; border: none; cursor: pointer;"></button>
      <div class="hero-seed-label-wrap">
        <button type="button" id="heroColorLabel" class="hero-seed-hex-btn font-mono" title="Haz clic para abrir el selector de color" aria-label="Modificar color hexadecimal #C42127">#C42127</button>
        <div class="hero-seed-underline"></div>
      </div>
    </div>
  </div>

  <!-- In-app Custom Coloristia Color Picker Popover (HSV: Tono, Saturación, Brillo) -->
  <div id="coloristiaPickerPopover" class="custom-picker-popover" style="display: none;" role="dialog" aria-label="Selector de color personalizado">
    <!-- Tono (Hue) -->
    <div class="custom-picker-slider-group">
      <span id="customPickerHueLabel" class="custom-picker-label">Tono</span>
      <div class="custom-picker-slider-track custom-picker-hue-track" id="customPickerHueTrack" role="slider" aria-labelledby="customPickerHueLabel" aria-label="Tono" aria-valuenow="0" aria-valuemin="0" aria-valuemax="360" tabindex="0">
        <div class="custom-picker-slider-handle" id="customPickerHueHandle"></div>
      </div>
    </div>

    <!-- Saturación (Saturation) -->
    <div class="custom-picker-slider-group">
      <span id="customPickerSatLabel" class="custom-picker-label">Saturación</span>
      <div class="custom-picker-slider-track custom-picker-sat-track" id="customPickerSatTrack" role="slider" aria-labelledby="customPickerSatLabel" aria-label="Saturación" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" tabindex="0">
        <div class="custom-picker-slider-handle" id="customPickerSatHandle"></div>
      </div>
    </div>

    <!-- Brillo (Value / Brightness) -->
    <div class="custom-picker-slider-group">
      <span id="customPickerValLabel" class="custom-picker-label">Brillo</span>
      <div class="custom-picker-slider-track custom-picker-val-track" id="customPickerValTrack" role="slider" aria-labelledby="customPickerValLabel" aria-label="Brillo" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" tabindex="0">
        <div class="custom-picker-slider-handle" id="customPickerValHandle"></div>
      </div>
    </div>

    <!-- Footer: Preview Circle + Hex Input + Aceptar Button -->
    <div class="custom-picker-footer">
      <div class="custom-picker-preview-circle" id="customPickerPreviewCircle" title="Color actual"></div>
      <div class="custom-picker-hex-badge">
        <input type="text" id="customPickerHexInput" class="custom-picker-hex-input" maxlength="7" spellcheck="false" autocomplete="off" value="#C42127" aria-label="Código HEX">
      </div>
      <button type="button" id="customPickerAcceptBtn" class="custom-picker-accept-btn" title="Aceptar selección">Aceptar</button>
    </div>
  </div>
</section>
