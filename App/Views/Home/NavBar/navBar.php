<?php
/**
 * Top navigation bar component for Coloristia.
 *
 * @var array|null $user
 * @var bool $isLoggedIn
 */
?>
<header class="coloristia-nav flex-row items-center justify-between">
  <div class="flex-row items-center gap10">
    <span class="brand-title">Coloristia</span>
  </div>

  <div class="nav-actions flex-row items-center gap12">
    <?php if ($isLoggedIn && !empty($user)): ?>
      <span class="text-sm text-muted font-medium">Hola, <strong class="text-white"><?= e($user['username'] ?? 'Usuario') ?></strong></span>
      <form action="/autenticacion/salir" method="POST" style="margin: 0; display: inline;">
        <?= \Base\Module\SecurityModule::csrfField() ?>
        <button type="submit" class="btn btn-outline btn-sm">Salir</button>
      </form>
    <?php else: ?>
      <button type="button" id="openLoginModalBtn" class="btn btn-outline btn-sm">Ingresar</button>
      <button type="button" id="openRegisterModalBtn" class="btn btn-primary btn-sm">Registrarse</button>
    <?php endif; ?>
  </div>
</header>
