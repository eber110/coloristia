<?php
/**
 * Center seed color display with interactive badge and custom color picker popover.
 */
?>
<section class="hero-seed-container">
  <div id="heroSeedsTrack" class="hero-seeds-track">
    <!-- Base / Default Working Color Circle (Always visible, changes on refresh or random) -->
    <div id="heroDefaultSeedItem" class="hero-seed-item">
      <div id="heroColorSwatch" class="hero-color-circle" title="Haz clic para abrir el selector de color" style="background-color: #C42127;"></div>
      <div class="hero-seed-label-wrap">
        <button type="button" id="heroColorLabel" class="hero-seed-hex-btn font-mono" title="Haz clic para abrir el selector de color">#C42127</button>
        <div class="hero-seed-underline"></div>
      </div>
    </div>
  </div>

  <!-- In-app Custom Coloristia Color Picker Popover -->
  <div id="coloristiaPickerPopover" class="custom-picker-popover" style="display: none;" role="dialog" aria-label="Selector de color personalizado">
    <div class="custom-picker-sat-val" id="customPickerSatVal">
      <div class="custom-picker-sat-val-white"></div>
      <div class="custom-picker-sat-val-black"></div>
      <div class="custom-picker-handle" id="customPickerSatValHandle"></div>
    </div>

    <div class="custom-picker-hue-bar" id="customPickerHueBar">
      <div class="custom-picker-hue-handle" id="customPickerHueHandle"></div>
    </div>

    <div class="custom-picker-hex-badge">
      <input type="text" id="customPickerHexInput" class="custom-picker-hex-input" maxlength="7" spellcheck="false" autocomplete="off" value="#C42127">
    </div>
  </div>
</section>
