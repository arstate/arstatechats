import React, { useState, useEffect } from 'react';
import Header from './Header';
import { getUsers, findUserById, findUserByName, deleteUser, isUsernameTaken, updateUsername } from '../services/firebaseService';
import type { User } from '../types';

interface UserListPageProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const UserListItem = ({ user, onSelect }: { user: User; onSelect: () => void; }) => (
    <li
        onClick={onSelect}
        className="flex items-center p-3 space-x-4 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
    >
        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">ID: {user.id}</p>
        </div>
    </li>
);

export default function UserListPage({ currentUser, onSelectUser, onLogout, onUserUpdate }: UserListPageProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State for editing profile
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(currentUser.name);
    const [editError, setEditError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = getUsers(setUsers);
        return () => unsubscribe();
    }, []);

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;
        
        if(term === currentUser.id || term === currentUser.name) {
            setError("You cannot add yourself.");
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            // Try searching by ID first, then by name
            const userById = await findUserById(term);
            if (userById) {
                onSelectUser(userById);
                return;
            }

            const userByName = await findUserByName(term);
            if (userByName) {
                onSelectUser(userByName);
                return;
            }
            
            setError('User not found with that ID or Name.');

        } catch (err) {
            console.error(err);
            setError('An error occurred while searching.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await deleteUser(currentUser.id);
                alert("Your account has been deleted.");
                onLogout();
            } catch (err) {
                console.error("Failed to delete account:", err);
                alert("An error occurred while deleting your account.");
            }
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setNewName(currentUser.name); // Reset on toggle/cancel
        setEditError('');
    };

    const handleSaveName = async () => {
        setEditError('');
        const trimmedName = newName.trim();

        if (trimmedName === currentUser.name) {
            setIsEditing(false);
            return;
        }

        if (trimmedName.length < 3) {
            setEditError('Username must be at least 3 characters long.');
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
            setEditError('Username can only contain letters, numbers, and underscores.');
            return;
        }

        setIsSaving(true);
        try {
            const taken = await isUsernameTaken(trimmedName, currentUser.id);
            if (taken) {
                setEditError('This username is already taken.');
            } else {
                await updateUsername(currentUser.id, trimmedName);
                onUserUpdate({ ...currentUser, name: trimmedName });
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Error updating username:', err);
            setEditError('An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const filteredUsers = users.filter(user => user.id !== currentUser.id);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header user={currentUser} onLogout={onLogout} />
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <div className="p-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Find User</h2>
                        <form onSubmit={handleSearchUser} className="flex space-x-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Enter user's ID or Name"
                                className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!searchTerm.trim() || isLoading}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md disabled:bg-gray-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                {isLoading ? 'Searching...' : 'Chat'}
                            </button>
                        </form>
                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                    </div>
                    
                    <div className="p-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Your Account</h2>
                         
                        {isEditing ? (
                            <div className="space-y-2">
                                <label htmlFor="usernameEdit" className="text-sm text-gray-600 block">Edit Your Name:</label>
                                <div className="flex space-x-2">
                                    <input
                                        id="usernameEdit"
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isSaving}
                                    />
                                    <button 
                                        onClick={handleSaveName} 
                                        disabled={isSaving || newName.trim() === ''}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md disabled:bg-gray-300 hover:bg-green-600 transition-colors"
                                    >
                                        {isSaving ? '...' : 'Save'}
                                    </button>
                                    <button 
                                        onClick={handleEditToggle} 
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {editError && <p className="mt-2 text-xs text-red-500">{editError}</p>}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Your Name: <span className="font-semibold text-gray-800">{currentUser.name}</span></p>
                                <button onClick={handleEditToggle} className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                                    Edit Profile
                                </button>
                            </div>
                        )}

                         <p className="mt-2 text-xs text-gray-500">Your ID: <span className="font-mono bg-gray-200 px-1 rounded">{currentUser.id}</span></p>
                         <button onClick={handleDeleteAccount} className="mt-3 w-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                            Delete My Account
                         </button>
                    </div>

                    <h2 className="text-lg font-semibold my-2 text-gray-700">All Users</h2>
                    <ul className="space-y-1 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        {filteredUsers.length > 0 ? (
                           filteredUsers.map(user => (
                                <UserListItem key={user.id} user={user} onSelect={() => onSelectUser(user)} />
                            ))
                        ) : (
                            <p className="p-4 text-center text-gray-500">No other users found.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}