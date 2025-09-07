
export interface User {
  id: string;
  name: string;
  avatar: string;
  isGuest: boolean;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  user: User;
}
