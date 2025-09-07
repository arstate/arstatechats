
import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { saveUser, createGuestUser } from '../services/firebaseService';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const GoogleLogo = () => (
    <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.23 0 6.13 1.11 8.4 3.29l6.3-6.3C34.93 2.57 29.88 0 24 0 14.61 0 6.66 5.33 2.7 13.04l7.95 6.18C12.42 12.97 17.7 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.17 25.61c0-1.68-.15-3.3-.44-4.86H24v9.17h12.5c-.54 2.97-2.18 5.49-4.7 7.22l7.55 5.83c4.4-4.06 6.96-10.03 6.96-17.36z"></path>
        <path fill="#FBBC05" d="M10.65 28.53c-.5-.95-.78-2.02-.78-3.13s.28-2.18.78-3.13l-7.95-6.18C.93 18.99 0 21.9 0 25.4c0 3.5.93 6.41 2.7 9.07l7.95-6.18z"></path>
        <path fill="#EA4335" d="M24 48c5.88 0 10.93-1.94 14.57-5.23l-7.55-5.83c-1.93 1.3-4.4 2.08-7.02 2.08-6.3 0-11.58-3.47-13.35-8.32L2.7 34.47C6.66 42.67 14.61 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

const GuestIcon = () => (
    <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

export default function LoginPage({ onLogin }: LoginPageProps) {
  
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: { name?: string; picture?: string; sub: string } = jwtDecode(credentialResponse.credential);
      // For Google AI Studio preview, we might not have a real Firebase backend.
      // So we can check for an empty config. In a real app, you'd handle this more robustly.
      try {
        const user = await saveUser(decoded);
        onLogin(user);
      } catch (error) {
        console.error("Firebase might not be configured. Using local user.", error);
        // Fallback for preview environments without backend
        const fallbackUser: User = { 
            id: decoded.sub, 
            name: decoded.name || "Google User", 
            avatar: decoded.picture || `https://picsum.photos/seed/${decoded.sub}/40/40`,
            isGuest: false
        };
        onLogin(fallbackUser);
      }
    }
  };

  const handleGuestLogin = () => {
    const guestUser = createGuestUser();
    onLogin(guestUser);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Arstate Chats</h1>
            <p className="mt-2 text-gray-500">Welcome back! Sign in to continue.</p>
        </div>
        <div className="flex flex-col space-y-4">
             <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        console.log('Login Failed');
                        alert('Google login failed. Please try again.');
                    }}
                    theme="outline"
                    shape="pill"
                    width="280px"
                />
            </div>
          <button onClick={handleGuestLogin} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            <GuestIcon />
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
