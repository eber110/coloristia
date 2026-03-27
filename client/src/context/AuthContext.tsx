import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Estructura de usuario exportada
export interface User {
  id: number;
  email: string;
  role: 'GUEST' | 'REGISTERED' | 'PREMIUM';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, tokenData: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User | null>(() => {
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) return JSON.parse(storedUser);
      return { id: 0, email: 'guest@coloral.local', role: 'GUEST' };
    } catch {
      return { id: 0, email: 'guest@coloral.local', role: 'GUEST' };
    }
    
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = (userData: User, tokenData: string) => {
  
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    
  };

  const logout = () => {
  
    setToken(null);
    setUser({ id: 0, email: 'guest@coloral.local', role: 'GUEST' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
  
}

export function useAuth() {

  const context = useContext(AuthContext);
  
  if (context === undefined) {
  
    throw new Error('useAuth requires AuthProvider');
    
  }
  
  return context;
  
}
