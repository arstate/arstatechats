import React, { useState, useRef } from 'react';
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

const ImageIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


export default function MessageInput({ currentUser, chatId }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
        e.target.value = ''; // Reset the input to allow selecting the same file again
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
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
    // Guard against sending empty messages or sending while another is in progress.
    if ((!messageText && !imageFile) || isSending || !chatId) return;

    setIsSending(true);

    try {
      // Logic for messages containing an image (with or without text)
      if (imageFile) {
        const imageUrl = await uploadImage(chatId, imageFile);
        await sendMessage(chatId, currentUser, { text: messageText, imageUrl });
      } 
      // Logic for text-only messages
      else if (messageText) {
        // AI Assistant command
        if (messageText.toLowerCase().startsWith('@assistant')) {
          const prompt = messageText.substring(10).trim();
          await sendMessage(chatId, currentUser, { text: messageText });

          // Clear the input after sending the prompt, so user sees it's sent.
          setInput('');

          // Dispatch events for the UI to show the AI is "thinking"
          dispatchAiStreamEvent('start');
          let fullResponse = '';
          await streamChatResponse(prompt, (chunk) => {
            fullResponse += chunk;
            dispatchAiStreamEvent('chunk', chunk);
          });
          dispatchAiStreamEvent('end');

          // Send the AI's response to the chat
          if (fullResponse.trim()) {
            const assistantUser: User = { ...ASSISTANT_USER, isGuest: true, usernameSet: true };
            await sendMessage(chatId, assistantUser, { text: fullResponse });
          }
          
          // The AI flow is complete, so we exit early.
          setIsSending(false);
          return;

        } else {
          // Standard text message
          await sendMessage(chatId, currentUser, { text: messageText });
        }
      }

      // If we reach here, a non-AI message was sent successfully.
      // Clear the inputs for the next message.
      setInput('');
      cancelImage();

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please check your connection or configuration.");
      // On error, inputs are not cleared, allowing the user to retry sending.
    } finally {
      setIsSending(false);
    }
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
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                type="button"
                onClick={handleImageUploadClick}
                className="p-2 text-gray-500 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Attach an image"
                disabled={isSending}
            >
                <ImageIcon />
            </button>
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