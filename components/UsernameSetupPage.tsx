import React, { useState } from 'react';
import { isUsernameTaken, updateUsername } from '../services/firebaseService';
import type { User } from '../types';

interface UsernameSetupPageProps {
  user: User;
  onUsernameUpdated: (user: User) => void;
}

export default function UsernameSetupPage({ user, onUsernameUpdated }: UsernameSetupPageProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setError('Username can only contain letters, numbers, and underscores.');
        return;
    }

    setIsLoading(true);
    try {
      const taken = await isUsernameTaken(trimmedUsername);
      if (taken) {
        setError('This username is already taken. Please choose another one.');
      } else {
        await updateUsername(user.id, trimmedUsername);
        onUsernameUpdated({ ...user, name: trimmedUsername, usernameSet: true });
      }
    } catch (err) {
      console.error('Error setting username:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Set Your Username</h1>
          <p className="mt-2 text-gray-500">Choose a unique username for your Arstate Chats account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., arstate_user"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-md disabled:bg-gray-400 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
