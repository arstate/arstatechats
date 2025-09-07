// NOTE: This service requires 'firebase' and 'uuid' packages.
// Install them with: npm install firebase uuid
// You also need to install types for uuid: npm install @types/uuid -D

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, serverTimestamp, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { FIREBASE_CONFIG } from '../constants';
import type { User, Message } from '../types';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
const storage = getStorage(app);

// Helper to create a consistent chat ID for two users
export const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('--');
};

export const uploadImage = async (chatId: string, file: File): Promise<string> => {
    const filePath = `chat_images/${chatId}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
};

// Rewritten to fetch all users and filter client-side to avoid needing a DB index.
export const findOrCreateUser = async (googleUser: { name?: string | null; picture?: string | null; sub: string }): Promise<User> => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let foundUser: (User & { id: string }) | null = null;

    if (snapshot.exists()) {
        const users = snapshot.val();
        for (const userId in users) {
            if (users[userId].googleId === googleUser.sub) {
                foundUser = { id: userId, ...users[userId], isGuest: false };
                break;
            }
        }
    }

    if (foundUser) {
        return foundUser;
    } else {
        const userId = uuidv4();
        const newUser: Omit<User, 'id' | 'isGuest'> & { googleId: string } = {
            name: googleUser.name || 'New User',
            avatar: googleUser.picture || `https://i.pravatar.cc/40?u=${userId}`,
            googleId: googleUser.sub,
            usernameSet: false,
        };
        await set(ref(db, `users/${userId}`), newUser);
        return { ...newUser, id: userId, isGuest: false };
    }
};


export const createGuestUser = (): User => {
    const userId = uuidv4();
    return {
        id: userId,
        name: `Guest-${userId.substring(0, 4)}`,
        avatar: `https://i.pravatar.cc/40?u=${userId}`,
        isGuest: true,
        usernameSet: true, // Guests don't set a username
    };
};

// Rewritten to fetch all users and check client-side. This avoids needing a database index.
// It's also case-insensitive and ignores the current user's own name.
export const isUsernameTaken = async (username: string, currentUserId: string): Promise<boolean> => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const users = snapshot.val();
        const lowerCaseUsername = username.toLowerCase();
        for (const userId in users) {
            // If a user has the same name and it's not the current user, then it's taken.
            if (users[userId].name?.toLowerCase() === lowerCaseUsername && userId !== currentUserId) {
                return true;
            }
        }
    }
    return false; // Not taken
};


export const updateUsername = async (userId: string, newName: string) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { name: newName, usernameSet: true });
};


export const sendMessage = (chatId: string, user: User, content: { text?: string; imageUrl?: string }) => {
  if (!content.text?.trim() && !content.imageUrl) {
    console.error("Attempted to send an empty message.");
    return;
  }

  const messagesRef = ref(db, `messages/${chatId}`);
  const newMessage = {
    ...content,
    user: { // Store a smaller user object to save space
        id: user.id,
        name: user.name,
        avatar: user.avatar
    },
    timestamp: serverTimestamp(),
    status: 'sent',
  };
  return push(messagesRef, newMessage);
};

export const onMessagesSnapshot = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(db, `messages/${chatId}`);
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messagesArray: Message[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(messagesArray);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Firebase read failed: ", error);
  });

  return () => off(messagesRef);
};

export const markMessagesAsRead = async (chatId: string, currentUserId: string) => {
    const messagesRef = ref(db, `messages/${chatId}`);
    const snapshot = await get(messagesRef);
    if (snapshot.exists()) {
        const updates: { [key: string]: any } = {};
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            if (message.user.id !== currentUserId && message.status === 'sent') {
                updates[`${childSnapshot.key}/status`] = 'read';
            }
        });
        if (Object.keys(updates).length > 0) {
            await update(messagesRef, updates);
        }
    }
};


export const getUsers = (callback: (users: User[]) => void) => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const usersArray: User[] = Object.keys(data).map(key => ({
                id: key,
                ...data[key],
                isGuest: false // Assuming registered users are not guests
            }));
            callback(usersArray);
        } else {
            callback([]);
        }
    });

    return () => off(usersRef);
};


export const findUserById = async (userId: string): Promise<User | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        return {
            id: userId,
            ...data,
            isGuest: false
        };
    }
    return null;
};

// Rewritten to fetch all users and search client-side to avoid needing a DB index.
// Also makes the search case-insensitive.
export const findUserByName = async (name: string): Promise<User | null> => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const users = snapshot.val();
        const lowerCaseName = name.toLowerCase();
        for (const userId in users) {
            if (users[userId].name?.toLowerCase() === lowerCaseName) {
                return { id: userId, ...users[userId], isGuest: false };
            }
        }
    }
    return null;
};

export const deleteUser = async (userId: string) => {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
    // Note: A complete solution would also remove user's messages,
    // but that is significantly more complex and out of scope here.
};