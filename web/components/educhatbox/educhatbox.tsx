'use client'

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

const EduChatBox: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'gpt'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { sender: 'user' as const, text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');

    try {
      setIsLoading(true);
      const response = await axios.post('/api/chatgpt', { message: input });
      const botMessage = { sender: 'gpt' as const, text: response.data.text };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching GPT response:', error);
      const errorMessage = { sender: 'gpt' as const, text: 'Sorry, something went wrong.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container bg-base-200 p-4 rounded-lg shadow-lg h-[80vh] flex flex-col">
      <div className="messages flex-grow overflow-y-auto mb-4 p-4 bg-base-100 rounded-lg">
        {messages.map((message, index) => (
          <div key={index} className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'} mb-4`}>
            <div className="chat-image avatar">
              <div className="w-10 rounded-full bg-primary flex items-center justify-center">
                {message.sender === 'gpt' ? <FaRobot /> : <FaUser />}
              </div>
            </div>
            <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-section flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="input input-bordered flex-grow mr-2"
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading} 
          className="btn btn-primary"
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </div>
    </div>
  );
};

export default EduChatBox;