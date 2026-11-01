<?php
/**
 * Top navigation bar component for Coloristia.
 *
 * @var array|null $user
 * @var bool $isLoggedIn
 */
?>
<header class="coloristia-nav flex-row items-center justify-between">
  <div class="flex-row center-center gap10">
    <figure class="hpx30">
      <img src="<?= LOGOPAG?>" alt="Logotipo Coloristia" class="cover" width="30" height="30">
    </figure>
    <h1 class="brand-title" style="margin: 0; font-size: 1.25rem; font-weight: inherit; line-height: 1;">Coloristia</h1>
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
