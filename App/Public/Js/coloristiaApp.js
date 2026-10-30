/**
 * @file coloristiaApp.js
 * @description Orquestador interactivo de Coloristia en el frontend.
 * Conecta el motor cromático con la interfaz de usuario, selector de color,
 * stepper de 6 a 16 variaciones, guardado de proyectos en SQLite y modales de autenticación.
 */

import {
  generateAllHarmonies,
  formatColorValue,
  hexToRgb,
  rgbToHex,
  rgbToHsl
} from "./colorEngine.js";

/**
 * Estado reactivo global de la aplicación.
 */
const state = {
  currentColor: "#C42127",
  variations: 6,
  colorSystem: "hex",
  isLoggedIn: false,
  projects: [],
  selectedHarmonyFilter: "all"
};

/**
 * Muestra una notificación Toast temporal no intrusiva.
 *
 * @param {string} message Mensaje a mostrar.
 * @param {string} type 'success' | 'error' | 'info'
 */
export function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} animate-fade-in`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/**
 * Obtiene el token CSRF configurado en la cabecera meta.
 *
 * @returns {string}
 */
export function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : "";
}

/**
 * Copia un texto al portapapeles y notifica al usuario.
 *
 * @param {string} text Texto a copiar.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    showToast(`¡Copiado al portapapeles: ${text}!`, "success");
  } catch (err) {
    showToast(`Copiado: ${text}`, "info");
  }
}

/**
 * Renderiza el tablero de armonías cromáticas.
 */
export function renderHarmonies() {
  const data = generateAllHarmonies(state.currentColor, state.variations, "family");

  // Actualizar previsualización central semilla
  const heroSwatch = document.getElementById("heroColorSwatch");
  const heroLabel = document.getElementById("heroColorLabel");
  const baseColorLabel = document.getElementById("baseColorLabel");
  const projectNameInput = document.getElementById("projectNameInput");
  const quickColorCircle = document.getElementById("quickColorCircle");

  if (heroSwatch) {
    heroSwatch.style.backgroundColor = data.seed.hex;
    heroSwatch.style.boxShadow = `0 10px 40px -10px ${data.seed.hex}88, 0 0 25px ${data.seed.hex}44`;
  }
  if (heroLabel) {
    heroLabel.textContent = data.seed.hex;
  }
  if (baseColorLabel) {
    baseColorLabel.textContent = data.seed.hex;
  }
  if (quickColorCircle) {
    quickColorCircle.style.backgroundColor = data.seed.hex;
  }
  if (projectNameInput && (!projectNameInput.value || projectNameInput.dataset.auto === "true")) {
    projectNameInput.value = `Paleta Base ${data.seed.hex}`;
    projectNameInput.dataset.auto = "true";
  }

  // Las 5 columnas primarias visibles por defecto según la imagen
  const primaryKeys = [
    "monochromatic",
    "complementary",
    "analogousStandard",
    "triad",
    "splitComplementary"
  ];

  // Armonías adicionales
  const extraKeys = [
    "analogousExtended",
    "analogousAccented",
    "tetradRectangular",
    "tetradSquare",
    "pentagon",
    "hexagon",
    "goldenRatio"
  ];

  const targetKeys = state.selectedHarmonyFilter === "extra"
    ? extraKeys
    : (state.selectedHarmonyFilter === "all" ? [...primaryKeys, ...extraKeys] : primaryKeys);

  const container = document.getElementById("harmoniesGrid");
  if (!container) return;

  container.innerHTML = "";

  targetKeys.forEach((key) => {
    const item = data.harmonies[key];
    if (!item) return;

    const column = document.createElement("div");
    column.className = "harmony-column flex-column gap12";

    const title = document.createElement("h3");
    title.className = "harmony-title text-center";
    title.textContent = item.rule.name;
    column.appendChild(title);

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards-stack flex-column gap8 w100";

    item.colors.forEach((colorObj) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "color-card";
      card.style.backgroundColor = colorObj.hex;
      card.style.color = colorObj.textColor;

      const formatted = formatColorValue(colorObj, state.colorSystem);

      card.innerHTML = `
        <span class="color-value font-mono">${formatted}</span>
        <span class="copy-hint">Copiar</span>
      `;

      card.addEventListener("click", () => {
        copyToClipboard(formatted);
      });

      cardsContainer.appendChild(card);
    });

    column.appendChild(cardsContainer);
    container.appendChild(column);
  });
}

/**
 * Actualiza el color semilla actual y re-renderiza.
 *
 * @param {string} hex Código HEX
 */
export function setSeedColor(hex) {
  let clean = hex.trim();
  if (!clean.startsWith("#")) {
    clean = "#" + clean;
  }
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
    return;
  }

  state.currentColor = clean.toUpperCase();
  const picker = document.getElementById("nativeColorPicker");
  if (picker) {
    picker.value = state.currentColor;
  }

  renderHarmonies();
}

/**
 * Modifica la cantidad de variaciones (6 a 16).
 *
 * @param {number} delta Cambio (+1 o -1)
 */
export function changeVariations(delta) {
  const current = state.variations;
  const next = Math.max(6, Math.min(16, current + delta));
  if (next !== current) {
    state.variations = next;
    const countDisplay = document.getElementById("variationCountDisplay");
    if (countDisplay) {
      countDisplay.textContent = next;
    }
    renderHarmonies();
  }
}

/**
 * Genera un color aleatorio con buena saturación para comenzar.
 */
export function generateRandomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(65 + Math.random() * 30);
  const l = Math.floor(40 + Math.random() * 25);
  const rgb = hexToRgb(formatColorValue({ h, s, l }, "hex"));
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  setSeedColor(hex);
}

/**
 * Cambia el sistema de color seleccionado y actualiza tarjetas.
 *
 * @param {string} system 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
 */
export async function changeColorSystem(system) {
  state.colorSystem = system.toLowerCase();
  renderHarmonies();

  // Si está autenticado, persistir preferencia en SQLite
  if (state.isLoggedIn) {
    try {
      const formData = new FormData();
      formData.append("color_system", state.colorSystem);
      formData.append("_token", getCsrfToken());

      await fetch("/user/color-system", {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": getCsrfToken()
        },
        body: formData
      });
    } catch (e) {
      console.warn("No se pudo guardar la preferencia de color:", e);
    }
  }
}

/**
 * Guarda el proyecto cromático en la base de datos SQLite.
 */
export async function saveCurrentProject() {
  if (!state.isLoggedIn) {
    openModal("loginModal");
    showToast("Inicia sesión para guardar tus proyectos.", "info");
    return;
  }

  const nameInput = document.getElementById("projectNameInput");
  const projectName = nameInput ? nameInput.value.trim() : "";
  const finalName = projectName || `Paleta Base ${state.currentColor}`;

  try {
    const formData = new FormData();
    formData.append("project_name", finalName);
    formData.append("hex_color", state.currentColor);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/projects/save", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": getCsrfToken()
      },
      body: formData
    });

    const res = await response.json();
    if (res.status === "success") {
      showToast(res.message, "success");
      if (res.project) {
        state.projects.unshift(res.project);
        renderProjectsList();
      }
    } else {
      showToast(res.message || "Error al guardar el proyecto.", "error");
    }
  } catch (error) {
    showToast("Error de conexión al guardar el proyecto.", "error");
  }
}

/**
 * Elimina un proyecto guardado de SQLite.
 *
 * @param {number} projectId
 */
export async function deleteProject(projectId) {
  if (!confirm("¿Deseas eliminar este proyecto?")) return;

  try {
    const formData = new FormData();
    formData.append("id", projectId);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/projects/delete", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": getCsrfToken()
      },
      body: formData
    });

    const res = await response.json();
    if (res.status === "success") {
      state.projects = state.projects.filter((p) => Number(p.id) !== Number(projectId));
      renderProjectsList();
      showToast(res.message, "success");
    } else {
      showToast(res.message || "Error al eliminar.", "error");
    }
  } catch (err) {
    showToast("Error de conexión.", "error");
  }
}

/**
 * Renderiza la lista de proyectos guardados dentro del modal de proyectos.
 */
export function renderProjectsList() {
  const container = document.getElementById("projectsListContainer");
  if (!container) return;

  if (!state.projects || state.projects.length === 0) {
    container.innerHTML = `
      <div class="empty-projects text-center py30 flex-column gap10">
        <p class="text-secondary text-base">Aún no has guardado ninguna paleta.</p>
        <p class="text-inactive text-sm">Escribe el nombre de tu proyecto arriba y haz clic en "Guardar".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  state.projects.forEach((proj) => {
    const item = document.createElement("div");
    item.className = "project-item flex-row items-center justify-between gap12 p12 br8";

    item.innerHTML = `
      <div class="flex-row items-center gap12">
        <div class="project-color-preview br50" style="background-color: ${proj.hex_color}; width: 34px; height: 34px; border: 2px solid rgba(255,255,255,0.2);"></div>
        <div class="flex-column">
          <span class="project-name bold600 text-white">${proj.project_name}</span>
          <span class="project-hex font-mono text-xs text-inactive">${proj.hex_color} • ${proj.created_at || ""}</span>
        </div>
      </div>
      <div class="flex-row items-center gap8">
        <button type="button" class="btn btn-sm btn-outline load-project-btn" data-hex="${proj.hex_color}">Cargar</button>
        <button type="button" class="btn btn-sm btn-danger delete-project-btn" data-id="${proj.id}">Eliminar</button>
      </div>
    `;

    item.querySelector(".load-project-btn").addEventListener("click", () => {
      setSeedColor(proj.hex_color);
      closeModal("projectsModal");
      showToast(`Cargada paleta: ${proj.project_name}`);
    });

    item.querySelector(".delete-project-btn").addEventListener("click", () => {
      deleteProject(proj.id);
    });

    container.appendChild(item);
  });
}

/**
 * Abre un modal por su ID.
 *
 * @param {string} modalId
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("is-active");
    document.body.classList.add("modal-open");
  }
}

/**
 * Cierra un modal por su ID.
 *
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("is-active");
    if (!document.querySelector(".modal.is-active")) {
      document.body.classList.remove("modal-open");
    }
  }
}

/**
 * Inicialización principal de Coloristia al cargar el DOM.
 */
export function initColoristia() {
  // Cargar estado inicial inyectado desde PHP
  if (window.COLORISTIA_DATA) {
    state.isLoggedIn = !!window.COLORISTIA_DATA.isLoggedIn;
    state.colorSystem = window.COLORISTIA_DATA.colorSystem || "hex";
    state.projects = window.COLORISTIA_DATA.projects || [];
  }

  // Inicializar selector de sistema de color
  const systemSelect = document.getElementById("colorSystemSelect");
  if (systemSelect) {
    systemSelect.value = state.colorSystem;
    systemSelect.addEventListener("change", (e) => {
      changeColorSystem(e.target.value);
    });
  }

  // Stepper de variaciones
  const decBtn = document.getElementById("decreaseVariationsBtn");
  const incBtn = document.getElementById("increaseVariationsBtn");
  if (decBtn) {
    decBtn.addEventListener("click", () => changeVariations(-1));
  }
  if (incBtn) {
    incBtn.addEventListener("click", () => changeVariations(1));
  }

  // Input de color nativo
  const nativePicker = document.getElementById("nativeColorPicker");
  const quickTrigger = document.getElementById("quickColorTrigger");
  const heroSwatch = document.getElementById("heroColorSwatch");
  const heroLabel = document.getElementById("heroColorLabel");

  if (nativePicker) {
    nativePicker.addEventListener("input", (e) => {
      setSeedColor(e.target.value);
    });
  }

  const triggerPicker = () => {
    if (nativePicker) nativePicker.click();
  };

  if (quickTrigger) quickTrigger.addEventListener("click", triggerPicker);
  if (heroSwatch) heroSwatch.addEventListener("click", triggerPicker);
  if (heroLabel) {
    heroLabel.addEventListener("click", () => {
      const input = prompt("Introduce un código de color HEX (ej: #C42127):", state.currentColor);
      if (input) setSeedColor(input);
    });
  }

  // Botón aleatorio
  const randomBtn = document.getElementById("randomColorBtn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => generateRandomColor());
  }

  // Guardar proyecto
  const saveBtn = document.getElementById("saveProjectBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentProject());
  }

  // Filtro de armonías (pestañas o botones)
  const filterHarmoniesSelect = document.getElementById("harmoniesFilterSelect");
  if (filterHarmoniesSelect) {
    filterHarmoniesSelect.addEventListener("change", (e) => {
      state.selectedHarmonyFilter = e.target.value;
      renderHarmonies();
    });
  }

  // Botón Mis Paletas
  const openProjectsBtn = document.getElementById("openProjectsModalBtn");
  if (openProjectsBtn) {
    openProjectsBtn.addEventListener("click", () => {
      renderProjectsList();
      openModal("projectsModal");
    });
  }

  // Botones de login y registro en el nav
  const openLoginBtn = document.getElementById("openLoginModalBtn");
  const openRegisterBtn = document.getElementById("openRegisterModalBtn");
  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => openModal("loginModal"));
  }
  if (openRegisterBtn) {
    openRegisterBtn.addEventListener("click", () => openModal("registerModal"));
  }

  // Botones para alternar entre modales de login y registro
  const switchRegisterBtn = document.getElementById("switchToRegisterBtn");
  const switchLoginBtn = document.getElementById("switchToLoginBtn");
  if (switchRegisterBtn) {
    switchRegisterBtn.addEventListener("click", () => {
      closeModal("loginModal");
      openModal("registerModal");
    });
  }
  if (switchLoginBtn) {
    switchLoginBtn.addEventListener("click", () => {
      closeModal("registerModal");
      openModal("loginModal");
    });
  }

  // Cerrar modales al hacer clic en overlays o botones de cierre
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-close-modal");
      closeModal(target);
    });
  });

  // Manejo de formulario de Login por AJAX
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": getCsrfToken()
          },
          body: formData
        });

        const res = await response.json();
        if (res.status === "success") {
          showToast(res.message, "success");
          setTimeout(() => window.location.reload(), 600);
        } else {
          showToast(res.message || "Credenciales incorrectas.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al iniciar sesión.", "error");
      }
    });
  }

  // Manejo de formulario de Registro por AJAX
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/auth/register", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": getCsrfToken()
          },
          body: formData
        });

        const res = await response.json();
        if (res.status === "success") {
          showToast(res.message, "success");
          setTimeout(() => window.location.reload(), 600);
        } else {
          showToast(res.message || "Error al registrarse.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al registrar.", "error");
      }
    });
  }

  // Render inicial
  renderHarmonies();
}

// Auto-inicializar si el documento ya cargó o escuchar DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initColoristia);
} else {
  initColoristia();
}
