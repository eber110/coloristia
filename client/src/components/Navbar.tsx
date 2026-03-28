import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {

  const { user, logout } = useAuth();
  
  return (
    <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem', padding: '1rem 2rem' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
        Coloristia
        {user?.role === 'PREMIUM' && (
          <span style={{ 
            fontSize: '0.45em', 
            background: 'linear-gradient(135deg, #6e8efb 0%, #a777e3 100%)', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            textTransform: 'lowercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            boxShadow: '0 2px 8px rgba(110, 142, 251, 0.4)'
          }}>pro</span>
        )}
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
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
