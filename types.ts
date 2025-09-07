export interface User {
  id: string;
  name: string;
  avatar: string;
  googleId?: string; // Optional: only for Google users
  isGuest: boolean;
  usernameSet: boolean; // True if the user has set a custom username
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  user: User;
  status: 'sent' | 'read';
}
