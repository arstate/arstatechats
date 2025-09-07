
import React from 'react';
import type { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onBack?: () => void;
  chatPartner?: User;
}

const BackIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export default function Header({ user, onLogout, onBack, chatPartner }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        {onBack && chatPartner && (
            <button onClick={onBack} className="p-1 rounded-full text-gray-600 hover:bg-gray-100">
                <BackIcon />
            </button>
        )}
        <h1 className="text-xl font-bold text-gray-800">
            {chatPartner ? chatPartner.name : "Arstate Chats"}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
