
import React, { useEffect, useState, useRef } from 'react';
import { onMessagesSnapshot } from '../services/firebaseService';
import type { User, Message } from '../types';
import { ASSISTANT_USER } from '../constants';

interface MessageListProps {
  currentUser: User;
  chatId: string;
}

const AIMessageStream = ({ text }: { text: string }) => {
    return (
        <div className="flex items-start space-x-3">
            <img src={ASSISTANT_USER.avatar} alt={ASSISTANT_USER.name} className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex flex-col items-start">
                <span className="text-xs font-bold text-indigo-600">{ASSISTANT_USER.name}</span>
                <div className="mt-1 px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-2xl rounded-tl-none">
                    <p>{text}<span className="inline-block w-1 h-4 ml-1 bg-gray-800 animate-pulse"></span></p>
                </div>
            </div>
        </div>
    );
}

const ChatMessage = ({ message, isCurrentUser }: { message: Message, isCurrentUser: boolean }) => {
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const bubbleColor = isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';
    const borderRadius = isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none';
    const nameColor = isCurrentUser ? 'text-blue-200' : 'text-gray-500';

    return (
        <div className={`flex items-start space-x-3 ${alignment}`}>
            {!isCurrentUser && <img src={message.user.avatar} alt={message.user.name} className="w-8 h-8 rounded-full" />}
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <span className={`text-xs font-bold ${nameColor}`}>{message.user.name}</span>
                <div className={`mt-1 px-4 py-2 text-sm ${bubbleColor} rounded-2xl ${borderRadius}`}>
                    <p>{message.text}</p>
                </div>
            </div>
            {isCurrentUser && <img src={message.user.avatar} alt={message.user.name} className="w-8 h-8 rounded-full" />}
        </div>
    );
};


export default function MessageList({ currentUser, chatId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [aiStream, setAiStream] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = onMessagesSnapshot(chatId, setMessages);
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const handleAiStream = ((event: CustomEvent) => {
      const { detail } = event;
      if (detail.type === 'chunk') {
        setAiStream(prev => (prev || '') + detail.text);
      } else if (detail.type === 'end') {
        setAiStream(null); 
      } else if (detail.type === 'start') {
        setAiStream('');
      }
    }) as EventListener;
    
    window.addEventListener('aistream', handleAiStream);
    return () => window.removeEventListener('aistream', handleAiStream);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStream]);

  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {sortedMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} isCurrentUser={msg.user.id === currentUser.id} />
      ))}
      {aiStream !== null && <AIMessageStream text={aiStream} />}
      <div ref={messagesEndRef} />
    </div>
  );
}
