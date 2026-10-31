<?php
/**
 * Application modal dialogs: My Palettes, Login, and Registration.
 *
 * @var array|null $user
 * @var bool $isLoggedIn
 */
?>

<!-- MODAL: MY PALETTES -->
<div id="projectsModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="projectsModalTitle">
  <div class="modal-backdrop" data-close-modal="projectsModal"></div>
  <button type="button" class="modal-overlay-close" data-close-modal="projectsModal" aria-label="Cerrar">&times;</button>
  <div class="modal-card">
    <div class="modal-card-head">
      <h3 id="projectsModalTitle" class="modal-card-title bold600">Mis Paletas Guardadas</h3>
      <button type="button" class="modal-close-btn" data-close-modal="projectsModal" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-card-body">
      <?php if (!$isLoggedIn): ?>
        <div class="text-center py20 flex-column gap12 items-center">
          <p class="text-secondary text-base">Inicia sesión para sincronizar y gestionar tus paletas en cualquier dispositivo.</p>
          <button type="button" class="btn-primary" data-close-modal="projectsModal" onclick="document.getElementById('openLoginModalBtn')?.click()">
            Iniciar Sesión
          </button>
        </div>
      <?php else: ?>
        <div id="projectsListContainer" class="flex-column gap10">
          <!-- Rendered via JS -->
        </div>
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- MODAL: LOGIN -->
<div id="loginModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
  <div class="modal-backdrop" data-close-modal="loginModal"></div>
  <div class="modal-card">
    <div class="modal-card-head">
      <h3 id="loginModalTitle" class="modal-card-title">Iniciar Sesión</h3>
      <button type="button" class="modal-close-btn" data-close-modal="loginModal" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-card-body">
      <form id="loginForm" class="flex-column gap16">
        <?= \Base\Module\SecurityModule::csrfField() ?>

        <div class="flex-column gap6">
          <label for="loginIdentifier" class="text-xs text-muted font-medium">Usuario o Correo Electrónico</label>
          <input type="text" id="loginIdentifier" name="identifier" class="input-control w100" required placeholder="tu_usuario o correo@ejemplo.com" autocomplete="username">
        </div>

        <div class="flex-column gap6">
          <label for="loginPassword" class="text-xs text-muted font-medium">Contraseña</label>
          <input type="password" id="loginPassword" name="password" class="input-control w100" required placeholder="••••••••" autocomplete="current-password">
        </div>

        <button type="submit" class="btn-primary w100" style="padding: 11px;">Entrar a Coloristia</button>

        <p class="text-xs text-center text-muted mt8">
          ¿No tienes una cuenta aún?
          <button type="button" id="switchToRegisterBtn" class="btn-link text-white font-semibold" style="background:none; border:none; cursor:pointer; text-decoration:underline;">
            Regístrate gratis
          </button>
        </p>
      </form>
    </div>
  </div>
</div>

<!-- MODAL: REGISTER -->
<div id="registerModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="registerModalTitle">
  <div class="modal-backdrop" data-close-modal="registerModal"></div>
  <div class="modal-card">
    <div class="modal-card-head">
      <h3 id="registerModalTitle" class="modal-card-title">Crear Cuenta</h3>
      <button type="button" class="modal-close-btn" data-close-modal="registerModal" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-card-body">
      <form id="registerForm" class="flex-column gap16">
        <?= \Base\Module\SecurityModule::csrfField() ?>

        <div class="flex-column gap6">
          <label for="registerUsername" class="text-xs text-muted font-medium">Nombre de Usuario</label>
          <input type="text" id="registerUsername" name="username" class="input-control w100" required placeholder="ej: eber_color" minlength="3" autocomplete="username">
        </div>

        <div class="flex-column gap6">
          <label for="registerEmail" class="text-xs text-muted font-medium">Correo Electrónico</label>
          <input type="email" id="registerEmail" name="email" class="input-control w100" required placeholder="tu_correo@ejemplo.com" autocomplete="email">
        </div>

        <div class="flex-column gap6">
          <label for="registerPassword" class="text-xs text-muted font-medium">Contraseña</label>
          <input type="password" id="registerPassword" name="password" class="input-control w100" required placeholder="Mínimo 6 caracteres" minlength="6" autocomplete="new-password">
        </div>

        <div class="flex-column gap6">
          <label for="registerColorSystem" class="text-xs text-muted font-medium">Sistema de Color Preferido</label>
          <select id="registerColorSystem" name="color_system" class="select-control w100">
            <option value="hex">HEX (#RRGGBB)</option>
            <option value="rgb">RGB (r, g, b)</option>
            <option value="hsl">HSL (h, s%, l%)</option>
            <option value="hsv">HSV (h, s%, v%)</option>
            <option value="cmyk">CMYK (c%, m%, y%, k%)</option>
          </select>
        </div>

        <button type="submit" class="btn-primary w100" style="padding: 11px;">Completar Registro</button>

        <p class="text-xs text-center text-muted mt8">
          ¿Ya tienes cuenta?
          <button type="button" id="switchToLoginBtn" class="btn-link text-white font-semibold" style="background:none; border:none; cursor:pointer; text-decoration:underline;">
            Inicia sesión aquí
          </button>
        </p>
      </form>
    </div>
  </div>
</div>

<!-- MODAL: EXPORT CODE -->
<div id="exportModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="exportModalTitle">
  <div class="modal-backdrop" data-close-modal="exportModal"></div>
  <button type="button" class="modal-overlay-close" data-close-modal="exportModal" aria-label="Cerrar">&times;</button>
  <div class="modal-card modal-card-export">
    <div class="modal-card-head">
      <h3 id="exportModalTitle" class="modal-card-title bold600">Exportar Paleta de Color</h3>
      <button type="button" class="modal-close-btn" data-close-modal="exportModal" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-card-body">
      <div class="export-controls-bar flex-row justify-between items-center gap12 flex-wrap mb16">
        <div class="export-tabs">
          <button type="button" class="export-tab-btn is-active" data-export-format="css">CSS Variables</button>
          <button type="button" class="export-tab-btn" data-export-format="tailwind">Tailwind Config</button>
          <button type="button" class="export-tab-btn" data-export-format="json">JSON Tokens</button>
        </div>

        <div class="export-scope-wrap flex-row items-center gap8">
          <label for="exportScopeSelect" class="text-xs text-muted" style="white-space: nowrap;">Alcance:</label>
          <select id="exportScopeSelect" class="select-control" style="height: 34px; padding: 0 10px; font-size: 0.8rem;">
            <option value="all">Todas las Armonías (12)</option>
            <optgroup label="Armonías Individuales">
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
            </optgroup>
          </select>
        </div>
      </div>

      <div class="code-preview-container">
        <pre class="code-preview-pre"><code id="exportCodePreview">/* Generando código... */</code></pre>
      </div>

      <div class="flex-row justify-between items-center mt16 flex-wrap gap10">
        <span id="exportFormatLabel" class="text-xs text-muted font-mono">Formato: CSS Custom Properties (:root)</span>
        <button type="button" id="copyExportCodeBtn" class="btn-primary copy-code-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span id="copyExportCodeBtnText">Copiar Código</span>
        </button>
      </div>
    </div>
  </div>
</div>
