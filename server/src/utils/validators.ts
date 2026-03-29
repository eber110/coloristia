// src/utils/validators.ts

// Validar formato de correo electrónico
export function isValidEmail(email: string): boolean {
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);

}

// Validar contraseña
export function isValidPassword(password: string): { isValid: boolean, error?: string } {
  
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (password.length > 20) {
    return { isValid: false, error: 'La contraseña no puede exceder los 20 caracteres' };
  }

  if (/\s/.test(password)) {
    return { isValid: false, error: 'La contraseña no puede contener espacios en blanco' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una letra mayúscula' };
  }

  // Al menos un caracter especial
  // /[!@#$%^&*(),.?":{}|<>]/
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un carácter especial' };
  }

  return { isValid: true };

}
