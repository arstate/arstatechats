import React, { useState, useEffect } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { User, Message } from '../types';
import { getChatId, onMessagesSnapshot } from '../services/firebaseService';

interface ChatPageProps {
  currentUser: User;
  chatPartner: User;
  onLogout: () => void;
  onBack: () => void;
}

export default function ChatPage({ currentUser, chatPartner, onLogout, onBack }: ChatPageProps) {
  const chatId = getChatId(currentUser.id, chatPartner.id);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = onMessagesSnapshot(chatId, setMessages);
    return () => unsubscribe();
  }, [chatId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header user={currentUser} onLogout={onLogout} onBack={onBack} chatPartner={chatPartner} />
      <div className="flex-1 overflow-hidden">
        <MessageList currentUser={currentUser} chatId={chatId} messages={messages} />
      </div>
      <MessageInput currentUser={currentUser} chatId={chatId} />
    </div>
  );
}
