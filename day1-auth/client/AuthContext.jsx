import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Velox Auth Context
// Manages global authentication state across the app

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('velox_user');
    const token = localStorage.getItem('velox_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem('velox_token', data.token);
        localStorage.setItem('velox_user', JSON.stringify(data.user));
        setUser(data.user);
        navigate('/dashboard');
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('velox_token');
    localStorage.removeItem('velox_user');
    navigate('/login');
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem('velox_token', data.token);
        localStorage.setItem('velox_user', JSON.stringify(data.user));
        setUser(data.user);
        navigate('/dashboard');
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem('velox_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function ProtectedRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Access denied</div>;
  }

  return children;
}

export function useAuth() {
  return useContext(AuthContext);
}
