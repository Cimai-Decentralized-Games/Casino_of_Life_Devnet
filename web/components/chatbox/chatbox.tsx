'use client'

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  fightId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '' || !isUsernameSet) return;

    const newMessage = {
      user: username,
      text: input,
      timestamp: new Date(),
      fightId: null
    };

    try {
      const response = await fetch('/api/chatbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        console.error('API Error:', result.error);
        return;
      }

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSetUsername = () => {
    if (username.trim().length >= 3) {
      setIsUsernameSet(true);
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="flex flex-col space-y-4 p-4 bg-gray-800 rounded">
        <h3 className="text-white text-lg">Enter your username to start chatting</h3>
        <div className="flex space-x-2">
          <input
            className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' ? handleSetUsername() : null}
            placeholder="Enter username (min 3 characters)"
            minLength={3}
          />
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 focus:outline-none"
            onClick={handleSetUsername}
            disabled={username.trim().length < 3}
          >
            Join Chat
          </button>
        </div>
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
          overscrollBehavior: 'contain' // Prevents scroll chaining
        }}
      >
        {messages.map((msg, index) => (
          <p 
            key={`${msg.timestamp}-${index}`} 
            className={`mb-2 text-white ${msg.user === username ? 'text-blue-400' : ''}`}
          >
            <strong>{msg.user}: </strong>{msg.text}
          </p>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' ? sendMessage() : null}
          placeholder="Type your message..."
        />
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 focus:outline-none"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
