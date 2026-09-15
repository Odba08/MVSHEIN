import React, { createContext, useContext, useState, useEffect } from 'react';

export const USERS_CONFIG = [
  {
    id: 'ana',
    name: 'Ana',
    email: 'ana@shein.com',
    password: 'MiaMiHija123',
    role: 'Supervisora General',
    avatar: '🌟',
    color: '#D946EF',
    baseSalary: 50, // Salario fijo semanal $50
    commissionPer10Carts: 20, // 20$ por cada 10 carritos (2$ por carrito)
    hasCommissions: true,
    // Ana puede ver y gestionar todo (Ana, Francis, Daily)
    allowedOperators: ['Ana', 'Francis', 'Daily']
  },
  {
    id: 'francis',
    name: 'Francis',
    email: 'francis@shein.com',
    password: 'OscarAmor08',
    role: 'Administradora / Líder',
    avatar: '👑',
    color: '#EC4899',
    baseSalary: 50, // Salario fijo semanal $50
    commissionPer10Carts: 20, // 20$ por cada 10 carritos
    hasCommissions: true,
    // Francis puede ver sus datos y los de Daily
    allowedOperators: ['Francis', 'Daily']
  },
  {
    id: 'daily',
    name: 'Daily',
    email: 'daily@shein.com',
    password: 'Agape0812.',
    role: 'Operadora de Carritos',
    avatar: '🌸',
    color: '#F43F5E',
    baseSalary: 50, // Solo salario fijo semanal $50
    commissionPer10Carts: 0, // Daily NO tiene comisión
    hasCommissions: false,
    // Daily SOLO puede ver sus propios datos
    allowedOperators: ['Daily']
  },
];

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mv_shein_logged_user_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [authError, setAuthError] = useState('');

  const login = (email, password) => {
    setAuthError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const found = USERS_CONFIG.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
    );

    if (found) {
      setCurrentUser(found);
      localStorage.setItem('mv_shein_logged_user_v5', JSON.stringify(found));
      return { success: true };
    } else {
      setAuthError('Correo o contraseña incorrectos. Verifica tus datos de acceso.');
      return { success: false, message: 'Credenciales inválidas' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mv_shein_logged_user_v5');
  };

  const canViewOperator = (operatorName) => {
    if (!currentUser) return false;
    return currentUser.allowedOperators.includes(operatorName);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers: USERS_CONFIG,
        login,
        logout,
        canViewOperator,
        authError,
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
