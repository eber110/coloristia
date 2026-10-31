<?php
/**
 * Main orchestrator view for Coloristia.
 *
 * @var array|null $user
 * @var array $projects
 * @var bool $isLoggedIn
 * @var string $colorSystem
 */
?>
<script>
  window.COLORISTIA_DATA = {
    isLoggedIn: <?= $isLoggedIn ? 'true' : 'false' ?>,
    colorSystem: <?= json_encode($colorSystem, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>,
    projects: <?= json_encode($projects, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>
  };
</script>

<div class="coloristia-wrapper">
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
    _part("Home.modals", ["user" => $user, "projects" => $projects, "isLoggedIn" => $isLoggedIn]);
    _part("Home.footer");
  ?>
</div>
