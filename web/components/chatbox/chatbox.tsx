'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaUser } from 'react-icons/fa';

interface Message {
  id?: string;
  user: string;
  text: string;
  timestamp: Date;
  isBot?: boolean;
  fightId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [roomId] = useState(() => `room_${Math.random().toString(36).substr(2, 9)}`);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch regular chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chatbox');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          return;
        }

        setMessages(prevMessages => {
          const newMessages = Array.isArray(data) ? data : [];
          const filteredNew = newMessages.filter((newMsg: Message) => 
            !prevMessages.some(msg => msg.id === newMsg.id)
          );
          return [...prevMessages, ...filteredNew].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (isUsernameSet) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [isUsernameSet]);

  // Auto-scroll
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages]);

  // Focus input after username is set
  useEffect(() => {
    if (isUsernameSet && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUsernameSet]);

  const handleSetUsername = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (username.trim().length >= 3) {
      setIsUsernameSet(true);
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        user: 'System',
        text: `Welcome to the chat, ${username}! Use @caballoloko to talk with CaballoLoko.`,
        timestamp: new Date(),
        isBot: true
      }]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() === '' || !isUsernameSet || isLoading) return;

    setIsLoading(true);
    const messageText = input.trim();
    setInput('');

    const isToCaballoLoko = messageText.toLowerCase().startsWith('@caballoloko');

    try {
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        user: username,
        text: messageText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      if (isToCaballoLoko) {
        const botResponse = await fetch('/api/educhatbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': roomId
          },
          body: JSON.stringify({
            message: messageText.replace(/@caballoloko/i, '').trim()
          }),
        });

        if (!botResponse.ok) {
          throw new Error('Failed to get CaballoLoko response');
        }

        const botData = await botResponse.json();
        
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          user: 'CaballoLoko',
          text: botData.response,
          timestamp: new Date(),
          isBot: true
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        const response = await fetch('/api/chatbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: username,
            text: messageText,
            timestamp: new Date()
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageText);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        user: 'System',
        text: 'Failed to send message. Please try again.',
        timestamp: new Date(),
        isBot: true
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="flex flex-col space-y-4 p-4 bg-gray-800 rounded">
        <h3 className="text-white text-lg">Enter your username to start chatting</h3>
        <form onSubmit={handleSetUsername} className="flex space-x-2">
          <input
            className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username (min 3 characters)"
            minLength={3}
            autoFocus
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 focus:outline-none"
            disabled={username.trim().length < 3}
          >
            Join Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white">Chatting as: <strong>{username}</strong></span>
        <button 
          className="px-2 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
          onClick={() => setIsUsernameSet(false)}
        >
          Change Username
        </button>
      </div>
      <div 
        className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-900 rounded scroll-container"
        style={{ 
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        {messages.map((msg, index) => (
          <div 
            key={`${msg.timestamp}-${index}`} 
            className={`mb-2 flex items-start gap-2 ${
              msg.user === username ? 'justify-end' : ''
            }`}
          >
            {msg.isBot && <FaRobot className="text-yellow-500 mt-1" />}
            <p className={`text-white ${
              msg.user === username ? 'text-blue-400' : 
              msg.isBot ? 'text-yellow-400' : ''
            }`}>
              <strong>{msg.user}: </strong>{msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          ref={inputRef}
          className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l focus:outline-none"
          value={input}
          onChange={handleInputChange}
          placeholder="Type @caballoloko to talk to CaballoLoko..."
          disabled={isLoading}
        />
        <button 
          type="submit"
          className={`px-4 py-2 text-white rounded-r focus:outline-none ${
            isLoading ? 'bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
