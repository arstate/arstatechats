// NOTE: This service requires 'firebase' and 'uuid' packages.
// Install them with: npm install firebase uuid
// You also need to install types for uuid: npm install @types/uuid -D

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, serverTimestamp, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { FIREBASE_CONFIG } from '../constants';
import type { User, Message } from '../types';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

// Helper to create a consistent chat ID for two users
export const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('--');
};

export const findOrCreateUser = async (googleUser: { name?: string | null; picture?: string | null; sub: string }): Promise<User> => {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('googleId'), equalTo(googleUser.sub));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        return { id: userId, ...userData[userId], isGuest: false };
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

export const isUsernameTaken = async (username: string): Promise<boolean> => {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('name'), equalTo(username));
    const snapshot = await get(q);
    return snapshot.exists();
};

export const updateUsername = async (userId: string, newName: string) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { name: newName, usernameSet: true });
};


export const sendMessage = (chatId: string, text: string, user: User) => {
  const messagesRef = ref(db, `messages/${chatId}`);
  const newMessage = {
    text,
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

export const findUserByName = async (name: string): Promise<User | null> => {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('name'), equalTo(name));
    const snapshot = await get(q);
    if (snapshot.exists()) {
        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        return { id: userId, ...userData[userId], isGuest: false };
    }
    return null;
};

export const deleteUser = async (userId: string) => {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
    // Note: A complete solution would also remove user's messages,
    // but that is significantly more complex and out of scope here.
};
