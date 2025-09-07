
import React, { useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import UserListPage from './components/UserListPage';
import { GOOGLE_CLIENT_ID } from './constants';
import type { User } from './types';

// A simple in-memory store for the user session, with persistence to localStorage.
const useUserStore = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const item = window.localStorage.getItem('arstate-user');
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return null;
    }
  });

  const login = useCallback((userData: User) => {
    try {
      window.localStorage.setItem('arstate-user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem('arstate-user');
      setUser(null);
    // FIX: Added curly braces to the catch block to fix syntax error. This resolves all reported errors.
    } catch (error) {
      console.error('Error removing from localStorage', error);
    }
  }, []);

  return { user, login, logout };
};


export default function App() {
  const { user, login, logout } = useUserStore();
  const [chatPartner, setChatPartner] = useState<User | null>(null);

  const handleLogout = () => {
    setChatPartner(null);
    logout();
  };
  
  const renderContent = () => {
    if (!user) {
      return <LoginPage onLogin={login} />;
    }
    if (chatPartner) {
      return (
        <ChatPage
          currentUser={user}
          chatPartner={chatPartner}
          onLogout={handleLogout}
          onBack={() => setChatPartner(null)}
        />
      );
    }
    return (
      <UserListPage
        currentUser={user}
        onSelectUser={setChatPartner}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen font-sans text-gray-800">
        {renderContent()}
      </div>
    </GoogleOAuthProvider>
  );
}
