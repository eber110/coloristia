import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'REGISTERED' | 'PREMIUM'>('REGISTERED');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  
    e.preventDefault();
    setError('');
    
    try {
    
      const response = await axios.post('http://localhost:5000/api/auth/register', {
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
          <input 
            type="password" 
            className="input-glass" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label>Membresía (Demo Testing)</label>
          <select 
            className="input-glass"
            value={role}
            onChange={e => setRole(e.target.value as 'REGISTERED' | 'PREMIUM')}
          >
            <option value="REGISTERED">Estándar (Registrado limit. a 3 colores)</option>
            <option value="PREMIUM">Premium (Ilimitado a 10 colores)</option>
          </select>
        </div>
        
        <button type="submit" className="button-primary" style={{ marginTop: '1rem' }}>Crear Cuenta</button>
      </form>
    </div>
  );
  
}
