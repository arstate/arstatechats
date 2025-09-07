import React, { useEffect, useRef, useMemo, useState } from 'react';
import { markMessagesAsRead } from '../services/firebaseService';
import type { User, Message } from '../types';
import { ASSISTANT_USER } from '../constants';

interface MessageListProps {
  currentUser: User;
  chatId: string;
  messages: Message[];
}

const SentIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const ReadIcon = () => <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7m-7 7l-4-4" /></svg>;

const MessageStatus = ({ status }: { status: 'sent' | 'read' }) => {
    if (status === 'read') return <ReadIcon />;
    return <SentIcon />;
};

const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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

    return (
        <div className={`flex items-start space-x-3 ${alignment}`}>
            {!isCurrentUser && <img src={message.user.avatar} alt={message.user.name} className="w-8 h-8 rounded-full" />}
            <div className={`flex flex-col max-w-xs md:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`text-sm ${bubbleColor} rounded-2xl ${borderRadius} overflow-hidden`}>
                    {message.imageUrl && (
                        <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={message.imageUrl} alt="Sent content" className="w-full h-auto" />
                        </a>
                    )}
                    {message.text && <p className={`px-3 ${message.imageUrl ? 'pt-2 pb-3' : 'py-2'}`}>{message.text}</p>}
                </div>
                 <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
                    {isCurrentUser && <MessageStatus status={message.status} />}
                </div>
            </div>
            {isCurrentUser && <img src={message.user.avatar} alt={message.user.name} className="w-8 h-8 rounded-full" />}
        </div>
    );
};


export default function MessageList({ currentUser, chatId, messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiStream, setAiStream] = useState<string | null>(null);

  useEffect(() => {
    // Mark incoming messages as read
    if (chatId && currentUser.id && messages.length > 0) {
        const hasUnread = messages.some(m => m.user.id !== currentUser.id && m.status === 'sent');
        if (hasUnread) {
            markMessagesAsRead(chatId, currentUser.id);
        }
    }
  }, [chatId, currentUser.id, messages]);

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

  const sortedMessages = useMemo(() => 
    [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );

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