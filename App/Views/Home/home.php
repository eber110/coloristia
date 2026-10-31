<?php
/**
 * Main orchestrator view for Coloristia.
 *
 * @var array|null $user
 * @var bool $isLoggedIn
 * @var string $colorSystem
 */
?>
<div class="coloristia-wrapper" id="coloristiaWrapper" data-logged-in="<?= $isLoggedIn ? '1' : '0' ?>" data-color-system="<?= e($colorSystem) ?>">
  <div class="ambient-glow ambient-glow-primary" id="ambientGlow1" aria-hidden="true"></div>
  <div class="ambient-glow ambient-glow-secondary" id="ambientGlow2" aria-hidden="true"></div>
  <div class="ambient-glow ambient-glow-tertiary" id="ambientGlow3" aria-hidden="true"></div>
  <div class="coloristia-container">
    <?php
      _part("Home.navBar", ["user" => $user, "isLoggedIn" => $isLoggedIn]);
      _part("Home.controlsBar", ["colorSystem" => $colorSystem, "isLoggedIn" => $isLoggedIn]);
      _part("Home.heroSeed");
      _part("Home.harmonies", ["isLoggedIn" => $isLoggedIn]);
    ?>
  </div>
  <?php
    _part("Home.modals", ["user" => $user, "isLoggedIn" => $isLoggedIn]);
    _part("Home.footer");
  ?>
</div>
