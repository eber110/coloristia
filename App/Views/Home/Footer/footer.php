<?php
/**
 * Official footer component for Coloristia.
 */
?>
<footer class="coloristia-footer w100">
  <div class="container p20">
    <div class="flex-row flex-column-sml top-around gap20">
      <!-- Column 1: Brand & description -->
      <div class="flex-column center-start gap12 w-fit">
        <div class="flex-row center-center gap10">
          <figure class="hpx30">
            <img src="<?= LOGOPAG?>" alt="" class="cover">
          </figure>
          <span class="brand-title">Coloristia</span>
        </div>
        <p class="text-xs text-muted x16" style="line-height: 1.6; max-width: 360px; margin: 0;">
          Generador inteligente de paletas cromáticas basado en armonía matemática y percepción visual. Diseñado para optimizar el flujo de trabajo de desarrolladores y diseñadores UI/UX.
        </p>
        <p class="x14"><?= svg("registered", "x20")?> - Coloristia 2026.</p>
      </div>

      <!-- Column 2: Quick Links -->
      <div class="flex-column w50 gap10 w-fit">
        <div class="flex-row center-start gap10">
          <figure class="hpx30">
            <img src="<?= DIR_SHOW_MEDIA."logo-esc.png"?>" alt="" class="cover">
          </figure>
          <span class="brand-title">Eber Sánchez Cornejo</span>
        </div>
        <div class="flex-column gap8 text-xs text-muted x14">
          <a href="https://ebersanchez.cl" target="_blank" rel="noopener noreferrer" class="textw shine-hover">Sitio Web Oficial</a>
          <a href="https://clikhub.app/eber" target="_blank" rel="noopener noreferrer" class="textw shine-hover flex-row center-start gap5">
            <figure class="hpx15 wpx15">
              <img src="<?= DIR_SHOW_MEDIA."logo-cursor.webp"?>" alt="" class="cover">
            </figure>
            Clikhub/@eber
          </a>
          <!-- <a href="https://github.com/eber110" target="_blank" rel="noopener noreferrer" class="textw shine-hover">GitHub (eber110)</a> -->
        </div>
        <p class="x14"><?= svg("registered", "x20")?> - Eber Sánchez Cornejo 2026.</p>
      </div>
    </div>
  </div>
</footer>
