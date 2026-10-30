<?php
/**
 * Center seed color display with interactive badge and custom color picker popover.
 */
?>
<section class="hero-seed-container">
  <div id="heroColorSwatch" class="hero-color-circle" title="Haz clic para abrir el selector de color" style="background-color: #C42127;">
    <div class="hero-circle-inner-btn" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    </div>
  </div>
  <button type="button" id="heroColorLabel" class="hero-color-tag font-mono" title="Haz clic para abrir el selector de color">#C42127</button>

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
