import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  
    e.preventDefault();
    setError('');
    
    try {
    
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      login(response.data.user, response.data.token);
      navigate('/');
      
    } catch (err: any) {
    
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      
    }
    
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Iniciar Sesión</h2>
        
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
        
        <button type="submit" className="button-primary" style={{ marginTop: '1rem' }}>Entrar</button>
      </form>
    </div>
  );
  
}
