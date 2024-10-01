'use client'

import React, { useState, useEffect, useRef } from 'react';
import Gun from 'gun';

interface Message {
  user: string;
  text: string;
  timestamp: number;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gun = Gun();

  useEffect(() => {
    const chatRef = gun.get('troll-box');
    chatRef.map().on((message: Message) => {
      setMessages(prevMessages => [...prevMessages, message].sort((a, b) => a.timestamp - b.timestamp));
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMessage: Message = {
      user: 'User', // Replace with actual user name or ID
      text: input,
      timestamp: Date.now()
    };

    gun.get('troll-box').set(newMessage);
    setInput('');
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-900 rounded">
        {messages.map((msg, index) => (
          <p key={index} className="mb-2 text-white">
            <strong>{msg.user}: </strong>{msg.text}
          </p>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l focus:outline-none"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' ? sendMessage() : null}
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