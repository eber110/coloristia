# Reporte de Proyecto: Coloristia

Este documento detalla la arquitectura, las librerías utilizadas y la lógica matemática detrás de **Coloristia**, un generador de paletas cromáticas profesional.

---

## Librerías Utilizadas

### Cliente (Frontend)
- **React 19 & Vite**: Framework principal y herramienta de construcción para una interfaz reactiva y rápida.
- **Axios**: Utilizada para realizar peticiones HTTP asíncronas al backend.
- **React Router Dom**: Gestiona la navegación entre las páginas de la aplicación.
- **React Colorful**: Un selector de color ligero y rápido utilizado para la entrada visual de colores.

### Servidor (Backend)
- **Express 5**: Framework para la creación de la API REST.
- **Prisma ORM**: Herramienta de mapeo objeto-relacional para interactuar con la base de datos de manera tipada.
- **JSON Web Token (JWT)**: Implementado para el manejo de sesiones y autenticación segura.
- **Bcryptjs**: Librería para el hashing y protección de contraseñas de usuario.
- **Nodemailer**: Utilizada para el envío de correos electrónicos de verificación.

---

## Secciones del Proyecto

### 1. Página de Registro
La sección de registro permite a nuevos usuarios crear una cuenta para acceder a funciones avanzadas como el guardado de paletas y el aumento del límite de colores.

- **Implementación**: Ubicada en `Register.tsx`. Utiliza un flujo de doble paso:
  1. **Formulario de Datos**: Recopila email y contraseña. Cuenta con validadores estrictos (mínimo 8 caracteres, una mayúscula, un carácter especial y sin espacios).
  2. **Verificación de Email**: Al registrarse, el servidor envía un código de 6 dígitos mediante **Nodemailer**. El usuario debe ingresar este código para activar su cuenta, garantizando la validez del correo electrónico.

### 2. Login
Gestiona el acceso de los usuarios registrados a la plataforma.

- **Implementación**: Ubicada en `Login.tsx`. 
- **Flujo de Autenticación**: Al enviar las credenciales, el backend verifica el hash de la contraseña con **Bcryptjs**. Si es correcto, genera un **JWT** que se almacena en el `AuthContext` y en el `localStorage` del navegador, permitiendo la persistencia de la sesión.

### 3. Paleta Guardada
Permite a los usuarios registrados (con rol `REGISTERED` o `PREMIUM`) persistir sus creaciones.

- **Implementación**: Gestionada mediante un modal en la página principal y una API dedicada en `/palettes`.
- **Funcionalidades**: 
  - Visualización de miniaturas de paletas guardadas.
  - Renombrado dinámico de paletas directamente en la interfaz.
  - Eliminación con confirmación de seguridad.
  - Función de "Carga", que inyecta el color base de la paleta guardada de vuelta en el generador principal para su edición.

### 4. Página Principal
Es el núcleo de la aplicación donde ocurre la magia de la generación cromática.

- **Implementación**: Ubicada en `Home.tsx`.
- **Características**:
  - **Selector de Sistema**: Permite visualizar colores en formatos **HEX**, **RGB** o **HSL**.
  - **Generador Inteligente**: Crea dinámicamente secciones de armonía cromática para cada color base definido por el usuario.
  - **Límites Dinámicos**: Los usuarios invitados (`GUEST`) tienen límites reducidos, mientras que los usuarios `PREMIUM` pueden generar hasta 15 variaciones por armonía y manejar múltiples colores base simultáneamente.

---

## Lógica Matemática de Color

Todas las paletas se generan en el archivo `colorUtils.ts` utilizando el modelo **HSL**. La fórmula matemática principal varía según la armonía seleccionada:

### Definiciones Base
- **H (Hue/Tono)**: 0-360°
- **S (Saturation/Saturación)**: 0-100%
- **L (Lightness/Luminosidad)**: 0-100%

### Fórmulas de Armonía

#### A. Monocromática
Mantiene el tono ($h$) y la saturación ($s$) constantes, variando linealmente la luminosidad ($l$).
- **Fórmula**: 
  $l_i = 15 + \left( \frac{85 - 15}{count - 1} \right) \times i$
- **Explicación**: Se genera una rampa de luminosidad desde el 15% (oscuro) hasta el 85% (claro) dividida por el número de variaciones deseadas.

#### B. Analógica
Mantiene la saturación y luminosidad constantes, variando el tono en un rango de 60°.
- **Fórmula**: 
  $h_i = (h - 30 + \text{step} \times i + 360) \pmod{360}$
  Donde $\text{step} = \frac{60}{count - 1}$.
- **Explicación**: Crea una transición suave de colores vecinos en el círculo cromático.

#### C. Complementaria
Combina la familia monocromática del color base con la familia monocromática de su opuesto (180°).
- **Fórmula**: 
  $h_{\text{base}} = h$
  $h_{\text{comp}} = (h + 180) \pmod{360}$
- **Explicación**: Proporciona el máximo contraste cromático posible.

#### D. Triádica
Utiliza tres tonos equidistantes en el círculo cromático (separados por 120°).
- **Fórmula**: 
  $h_1 = h$, $h_2 = (h + 120) \pmod{360}$, $h_3 = (h + 240) \pmod{360}$
- **Explicación**: Ofrece una paleta balanceada y vibrante.

#### E. Complementario Dividido (Split-Complementary)
En lugar del complementario directo, utiliza los dos colores adyacentes a este (150° y 210°).
- **Fórmula**: 
  $h_1 = h$, $h_2 = (h + 150) \pmod{360}$, $h_3 = (h + 210) \pmod{360}$
- **Explicación**: Ofrece un contraste fuerte pero con menos tensión visual que el complementario directo.

---
*Documentación generada para Coloristia - Desarrollado por Eber Sánchez Cornejo.*
