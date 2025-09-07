// IMPORTANT: Replace with your Google Client ID
export const GOOGLE_CLIENT_ID = "833864746763-8fr2dig39e6mtnuin4qql5en8r62ie4s.apps.googleusercontent.com";

// IMPORTANT: You MUST replace the placeholder values below with your Firebase project's configuration.
// You can find these details in your Firebase project settings. The app will not work otherwise.
export const FIREBASE_CONFIG = {
  // I have pasted the API key you provided.
  apiKey: "AIzaSyB2ptt2GOfYiZbMQon25HVSwQqwoRyHfvE",

  // Your project's auth domain
  authDomain: "arstate-chat.firebaseapp.com",

  // The URL for your Realtime Database. This should fix the error.
  databaseURL: "https://arstate-chat-default-rtdb.asia-southeast1.firebasedatabase.app/",

  // Your project ID
  projectId: "arstate-chat",

  // Your project's storage bucket
  storageBucket: "arstate-chat.appspot.com",

  // You can find this in your Firebase project settings (optional but recommended)
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",

  // You can find this in your Firebase project settings (optional but recommended)
  appId: "PASTE_YOUR_APP_ID_HERE"
};

export const ASSISTANT_USER: { id: string, name: string, avatar: string } = {
    id: 'ai-assistant',
    name: 'Arstate Assistant',
    avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 9.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm5 5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-5-5c.83 0 1.5.67 1.5 1.5S10.33 11 9.5 11s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM12 18.5c-2.49 0-4.5-2.01-4.5-4.5h9c0 2.49-2.01 4.5-4.5 4.5z"></path></svg>`
};