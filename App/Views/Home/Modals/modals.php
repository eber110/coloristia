<?php
/**
 * Application modal dialogs: My Palettes, Login, and Registration.
 *
 * @var array|null $user
 * @var array $projects
 * @var bool $isLoggedIn
 */
?>

<!-- MODAL: MY PALETTES -->
<div id="projectsModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="projectsModalTitle">
  <div class="modal-backdrop" data-close-modal="projectsModal"></div>
  <div class="modal-card">
    <div class="modal-card-head">
      <h3 id="projectsModalTitle" class="modal-card-title">Mis Paletas Guardadas</h3>
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
          <input type="text" id="loginIdentifier" name="identifier" class="input-control w100" required placeholder="tu_usuario o correo@ejemplo.com">
        </div>

        <div class="flex-column gap6">
          <label for="loginPassword" class="text-xs text-muted font-medium">Contraseña</label>
          <input type="password" id="loginPassword" name="password" class="input-control w100" required placeholder="••••••••">
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
          <input type="text" id="registerUsername" name="username" class="input-control w100" required placeholder="ej: eber_color" minlength="3">
        </div>

        <div class="flex-column gap6">
          <label for="registerEmail" class="text-xs text-muted font-medium">Correo Electrónico</label>
          <input type="email" id="registerEmail" name="email" class="input-control w100" required placeholder="tu_correo@ejemplo.com">
        </div>

        <div class="flex-column gap6">
          <label for="registerPassword" class="text-xs text-muted font-medium">Contraseña</label>
          <input type="password" id="registerPassword" name="password" class="input-control w100" required placeholder="Mínimo 6 caracteres" minlength="6">
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
