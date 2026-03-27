import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {

  const { user, logout } = useAuth();
  
  return (
    <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem', padding: '1rem 2rem' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 800 }}>
        Coloral
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span>Rol: <strong style={{ color: '#a777e3' }}>{user?.role}</strong></span>
        
        {user?.role === 'GUEST' ? (
          <>
            <Link to="/login" className="button-secondary" style={{ textDecoration: 'none' }}>Entrar</Link>
            <Link to="/register" className="button-primary" style={{ textDecoration: 'none' }}>Registrarse</Link>
          </>
        ) : (
          <button onClick={logout} className="button-secondary">Salir</button>
        )}
      </div>
    </nav>
  );
  
}
