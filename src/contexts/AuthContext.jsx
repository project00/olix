// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controlla se esiste un token all'avvio dell'app
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Potresti aggiungere qui una verifica del token
        setIsAuthenticated(true);
        try {
          // Da JWT puoi estrarre le informazioni base dell'utente
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.userId,
            username: payload.user,
            role: payload.role
          });
        } catch (e) {
          console.error('Errore nella decodifica del token', e);
        }
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  // Funzione per il login
  const login = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);

    try {
      // Estrai info utente dal token
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.userId,
        username: payload.user,
        role: payload.role
      });
    } catch (e) {
      console.error('Errore nella decodifica del token', e);
    }
  };

  // Funzione per il logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};
