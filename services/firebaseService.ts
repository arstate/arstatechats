
// NOTE: This service requires 'firebase' and 'uuid' packages.
// Install them with: npm install firebase uuid
// You also need to install types for uuid: npm install @types/uuid -D

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, serverTimestamp, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { FIREBASE_CONFIG } from '../constants';
import type { User, Message } from '../types';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

// Helper to create a consistent chat ID for two users
export const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('--');
};

export const saveUser = async (googleUser: { name?: string | null; picture?: string | null; sub: string }): Promise<User> => {
  const userId = uuidv4();
  const newUser: User = {
    id: userId,
    name: googleUser.name || 'Anonymous User',
    avatar: googleUser.picture || `https://i.pravatar.cc/40?u=${userId}`,
    isGuest: false,
  };
  
  const userNodeRef = ref(db, `users/${userId}`);
  // We store the user data without the ID, as the ID is the key
  await set(userNodeRef, {
      name: newUser.name,
      avatar: newUser.avatar,
      googleId: googleUser.sub
  });

  return newUser;
};

export const createGuestUser = (): User => {
    const userId = uuidv4();
    return {
        id: userId,
        name: `Guest-${userId.substring(0, 4)}`,
        avatar: `https://i.pravatar.cc/40?u=${userId}`,
        isGuest: true,
    };
};

export const sendMessage = (chatId: string, text: string, user: User) => {
  const messagesRef = ref(db, `messages/${chatId}`);
  const newMessage = {
    text,
    user,
    timestamp: serverTimestamp(),
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

export const getUsers = (callback: (users: User[]) => void) => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const usersArray: User[] = Object.keys(data).map(key => ({
                id: key,
                name: data[key].name,
                avatar: data[key].avatar,
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
            name: data.name,
            avatar: data.avatar,
            isGuest: false
        };
    }
    return null;
};
