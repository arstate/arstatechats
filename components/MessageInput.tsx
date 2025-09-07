import React, { useState } from 'react';
import { sendMessage, uploadImage } from '../services/firebaseService';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dispatchAiStreamEvent = (type: 'start' | 'chunk' | 'end', text?: string) => {
    window.dispatchEvent(new CustomEvent('aistream', { detail: { type, text } }));
  };

  const handleFileSelected = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (e.clipboardData.files.length > 0) {
        e.preventDefault();
        handleFileSelected(e.clipboardData.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
  };
  
  const cancelImage = () => {
      setImageFile(null);
      setImagePreview(null);
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = input.trim();
    if ((messageText === '' && !imageFile) || isSending || !chatId) return;

    setIsSending(true);
    setInput('');
    const localImageFile = imageFile;
    cancelImage();

    if (localImageFile) {
      try {
        const imageUrl = await uploadImage(chatId, localImageFile);
        await sendMessage(chatId, currentUser, { text: messageText, imageUrl });
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      }
    } else if (messageText.toLowerCase().startsWith('@assistant')) {
      const prompt = messageText.substring(10).trim();
      
      await sendMessage(chatId, currentUser, { text: messageText });
      
      dispatchAiStreamEvent('start');
      let fullResponse = '';
      await streamChatResponse(prompt, (chunk) => {
        fullResponse += chunk;
        dispatchAiStreamEvent('chunk', chunk);
      });
      
      dispatchAiStreamEvent('end');
      if (fullResponse.trim()) {
         const assistantUser: User = { ...ASSISTANT_USER, isGuest: true, usernameSet: true };
         await sendMessage(chatId, assistantUser, { text: fullResponse });
      }
    } else {
      await sendMessage(chatId, currentUser, { text: messageText });
    }
    
    setIsSending(false);
  };

  const dropZoneClasses = isDragging
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-200 bg-white';


  return (
    <div 
        className={`p-4 border-t transition-colors ${dropZoneClasses}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
    >
      <div className="relative">
          {imagePreview && (
              <div className="relative w-24 h-24 mb-2">
                  <img src={imagePreview} alt="Image preview" className="w-full h-full rounded-lg object-cover" />
                  <button 
                      onClick={cancelImage} 
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-500 transition-colors"
                      aria-label="Remove image"
                  >
                      &times;
                  </button>
              </div>
          )}
          <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder={imageFile ? "Add a caption..." : "Type, paste, or drop an image..."}
              className="flex-1 px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={(input.trim() === '' && !imageFile) || isSending}
              className="flex-shrink-0 p-2 text-white bg-blue-500 rounded-full disabled:bg-gray-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
      </div>
    </div>
  );
}