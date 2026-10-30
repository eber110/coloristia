<?php
/**
 * Center seed color display with interactive badge and custom color picker popover.
 */
?>
<section class="hero-seed-container">
  <div class="hero-seeds-track flex-row items-center justify-center gap30 flex-wrap">
    <!-- Primary Working Seed Circle -->
    <div class="hero-seed-item flex-column items-center">
      <div id="heroColorSwatch" class="hero-color-circle" title="Haz clic para abrir el selector de color" style="background-color: #C42127;">
        <div class="hero-circle-inner-btn" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </div>
      </div>
      <button type="button" id="heroColorLabel" class="hero-color-tag font-mono" title="Haz clic para abrir el selector de color">#C42127</button>
    </div>

    <!-- Loaded / Reference Palette Circle (appears when loaded or pinned) -->
    <div id="heroLoadedPaletteBox" class="hero-seed-item flex-column items-center" style="display: none;">
      <button type="button" id="goToLoadedPaletteBtn" class="pill-go-to-palette" title="Ir a esta paleta">Ir a la paleta</button>
      <div id="heroLoadedSwatch" class="hero-color-circle hero-loaded-circle" title="Haz clic para usar esta paleta">
        <div class="hero-loaded-actions flex-row items-center justify-center gap8">
          <button type="button" id="editLoadedPaletteNameBtn" class="hero-loaded-action-btn" title="Editar nombre" aria-label="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button type="button" id="dismissLoadedPaletteBtn" class="hero-loaded-action-btn hero-loaded-dismiss-btn" title="Quitar de referencia" aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <span id="heroLoadedLabel" class="hero-loaded-hex-label font-mono">#D56F62</span>
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
