import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

export default function Register() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role] = useState<'REGISTERED' | 'PREMIUM'>('REGISTERED');
  const [error, setError] = useState('');

  // Validadores para el registro
  const isPasswordValid = 
    password.length >= 8 && 
    password.length <= 20 && 
    /[A-Z]/.test(password) && 
    /[!@#$%^&*(),.?":{}|<>]/.test(password) && 
    !/\s/.test(password);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isEmailValid && isPasswordValid;
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  
    e.preventDefault();
    setError('');
    
    try {
    
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        role
      });
      
      login(response.data.user, response.data.token);
      navigate('/');
      
    } catch (err: any) {
    
      setError(err.response?.data?.error || 'Error al registrarse');
      
    }
    
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Registro de Usuario</h2>
        
        {error && <div style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label>Email</label>
          <input 
            type="email" 
            className="input-glass" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label>Contraseña</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-glass" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                opacity: 0.8
              }}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? "🔒" : "👁️"}
            </button>
          </div>
          {password.length > 0 && !isPasswordValid && (
            <div style={{ fontSize: '0.85rem', color: '#ff6b6b' }}>
              La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, un carácter especial y sin espacios.
            </div>
          )}
        </div>
        
        {/* Selección de membresía oculta temporalmente */}
        
        <button 
          type="submit" 
          className="button-primary" 
          style={{ 
            marginTop: '1rem', 
            opacity: isFormValid ? 1 : 0.5, 
            cursor: isFormValid ? 'pointer' : 'not-allowed' 
          }}
          disabled={!isFormValid}
        >
          Crear Cuenta
        </button>
      </form>
    </div>
  );
  
}
