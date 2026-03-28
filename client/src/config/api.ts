// C:\Users\eber\Documents\coloristia\client\src\config\api.ts

// Esta configuración detecta automáticamente si estamos en desarrollo o en producción (al subir a Bluehosting)
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

export default API_BASE_URL;
