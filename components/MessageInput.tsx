

import React, { useState } from 'react';
import { sendMessage } from '../services/firebaseService';
import { streamChatResponse } from '../services/geminiService';
import type { User } from '../types';
import { ASSISTANT_USER } from '../constants';

interface MessageInputProps {
  currentUser: User;
  chatId: string;
}

const SendIcon = () => (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);


export default function MessageInput({ currentUser, chatId }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const dispatchAiStreamEvent = (type: 'start' | 'chunk' | 'end', text?: string) => {
    window.dispatchEvent(new CustomEvent('aistream', { detail: { type, text } }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isSending || !chatId) return;

    setIsSending(true);
    const messageText = input.trim();
    setInput('');
    
    if (messageText.toLowerCase().startsWith('@assistant')) {
      const prompt = messageText.substring(10).trim();
      
      await sendMessage(chatId, `@assistant ${prompt}`, currentUser);
      
      dispatchAiStreamEvent('start');
      let fullResponse = '';
      await streamChatResponse(prompt, (chunk) => {
        fullResponse += chunk;
        dispatchAiStreamEvent('chunk', chunk);
      });
      
      dispatchAiStreamEvent('end');
      if (fullResponse.trim()) {
         // FIX: Added usernameSet property to satisfy the User type.
         const assistantUser: User = { ...ASSISTANT_USER, isGuest: true, usernameSet: true };
         await sendMessage(chatId, fullResponse, assistantUser);
      }
    } else {
      await sendMessage(chatId, messageText, currentUser);
    }
    
    setIsSending(false);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSend} className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message or @assistant..."
          className="flex-1 px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={input.trim() === '' || isSending}
          className="flex-shrink-0 p-2 text-white bg-blue-500 rounded-full disabled:bg-gray-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}