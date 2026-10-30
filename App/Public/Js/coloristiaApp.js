/**
 * @file coloristiaApp.js
 * @description Frontend orchestrator for Coloristia.
 * Connects the color engine with the user interface, color picker,
 * 6-to-16 variation stepper, SQLite project persistence, and authentication modals.
 */

import {
  generateAllHarmonies,
  formatColorValue,
  hexToRgb,
  rgbToHex,
  rgbToHsl
} from "./colorEngine.js";

/**
 * Global reactive application state.
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
 * Displays a non-intrusive toast notification.
 *
 * @param {string} message Message text to display.
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
 * Retrieves the CSRF token from the meta tag in the HTML head.
 *
 * @returns {string}
 */
export function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : "";
}

/**
 * Copies text to the clipboard and provides user feedback.
 *
 * @param {string} text Text to copy.
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
 * Renders chromatic harmonies grid and hero preview.
 */
export function renderHarmonies() {
  const data = generateAllHarmonies(state.currentColor, state.variations, "family");

  // Update central seed swatch preview and labels
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

  // 5 primary harmony columns visible by default as seen in image 1
  const primaryKeys = [
    "monochromatic",
    "complementary",
    "analogousStandard",
    "triad",
    "splitComplementary"
  ];

  // Extended and auxiliary harmonies
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
 * Updates current seed color and triggers re-render.
 *
 * @param {string} hex HEX color code.
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
 * Modifies variation count between 6 and 16.
 *
 * @param {number} delta Step change (+1 or -1).
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
 * Generates a vibrant random seed color.
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
 * Changes active color system and updates palette cards in-place.
 *
 * @param {string} system 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
 */
export async function changeColorSystem(system) {
  state.colorSystem = system.toLowerCase();
  renderHarmonies();

  // If user is authenticated, persist preferred color system in SQLite
  if (state.isLoggedIn) {
    try {
      const formData = new FormData();
      formData.append("color_system", state.colorSystem);
      formData.append("_token", getCsrfToken());

      await fetch("/usuario/sistema-color", {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": getCsrfToken()
        },
        body: formData
      });
    } catch (e) {
      console.warn("Unable to persist color system preference:", e);
    }
  }
}

/**
 * Saves current palette project into the SQLite database.
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

    const response = await fetch("/proyectos/guardar", {
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
 * Deletes a saved project from the database.
 *
 * @param {number} projectId
 */
export async function deleteProject(projectId) {
  if (!confirm("¿Deseas eliminar este proyecto?")) return;

  try {
    const formData = new FormData();
    formData.append("id", projectId);
    formData.append("_token", getCsrfToken());

    const response = await fetch("/proyectos/eliminar", {
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
 * Renders the saved projects list inside the drawer modal.
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
 * Opens a modal dialog by its element ID.
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
 * Closes an active modal dialog by its element ID.
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
 * Main application bootstrap function.
 */
export function initColoristia() {
  // Load initial state injected from PHP backend
  if (window.COLORISTIA_DATA) {
    state.isLoggedIn = !!window.COLORISTIA_DATA.isLoggedIn;
    state.colorSystem = window.COLORISTIA_DATA.colorSystem || "hex";
    state.projects = window.COLORISTIA_DATA.projects || [];
  }

  // Color system dropdown event listener
  const systemSelect = document.getElementById("colorSystemSelect");
  if (systemSelect) {
    systemSelect.value = state.colorSystem;
    systemSelect.addEventListener("change", (e) => {
      changeColorSystem(e.target.value);
    });
  }

  // Variation count stepper event listeners
  const decBtn = document.getElementById("decreaseVariationsBtn");
  const incBtn = document.getElementById("increaseVariationsBtn");
  if (decBtn) {
    decBtn.addEventListener("click", () => changeVariations(-1));
  }
  if (incBtn) {
    incBtn.addEventListener("click", () => changeVariations(1));
  }

  // Color pickers and swatches
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

  // Random color button
  const randomBtn = document.getElementById("randomColorBtn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => generateRandomColor());
  }

  // Save project button
  const saveBtn = document.getElementById("saveProjectBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentProject());
  }

  // Harmonies filter dropdown
  const filterHarmoniesSelect = document.getElementById("harmoniesFilterSelect");
  if (filterHarmoniesSelect) {
    filterHarmoniesSelect.addEventListener("change", (e) => {
      state.selectedHarmonyFilter = e.target.value;
      renderHarmonies();
    });
  }

  // Saved projects modal trigger
  const openProjectsBtn = document.getElementById("openProjectsModalBtn");
  if (openProjectsBtn) {
    openProjectsBtn.addEventListener("click", () => {
      renderProjectsList();
      openModal("projectsModal");
    });
  }

  // Authentication modal buttons
  const openLoginBtn = document.getElementById("openLoginModalBtn");
  const openRegisterBtn = document.getElementById("openRegisterModalBtn");
  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => openModal("loginModal"));
  }
  if (openRegisterBtn) {
    openRegisterBtn.addEventListener("click", () => openModal("registerModal"));
  }

  // Switch between login and registration modals
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

  // Modal close triggers
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-close-modal");
      closeModal(target);
    });
  });

  // AJAX Login form handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/autenticacion/ingresar", {
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

  // AJAX Register form handler
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      formData.append("_token", getCsrfToken());

      try {
        const response = await fetch("/autenticacion/registro", {
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

  // Initial harmony rendering
  renderHarmonies();
}

// Auto-bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initColoristia);
} else {
  initColoristia();
}
