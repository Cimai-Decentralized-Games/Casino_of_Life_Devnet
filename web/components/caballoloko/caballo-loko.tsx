'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const CaballoLoko: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [roomId] = useState(() => `room_${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize chat service
  useEffect(() => {
    const initService = async () => {
      try {
        const response = await fetch('/api/educhatbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': roomId
          },
          body: JSON.stringify({
            message: 'init',
            init: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to initialize chat service');
        }

        setIsServiceReady(true);
        
        // Add initial greeting
        setMessages([{
          sender: 'agent',
          text: "¡Hola! I'm Caballo Loko. How can I assist you today?"
        }]);

      } catch (error) {
        console.error('Service initialization error:', error);
        setIsServiceReady(false);
      }
    };

    initService();
  }, [roomId]);

  const handleSend = async () => {
    if (!input.trim() || !isServiceReady) return;

    const userMessage: Message = {
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/educhatbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': roomId
        },
        body: JSON.stringify({
          message: input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      console.log('Response data:', data);  // Debug log

      // Remove success check and use response directly
      const botMessage: Message = {
        sender: 'agent',
        text: data.response || data.message  // Try both response and message fields
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: error instanceof Error ? error.message : 'Sorry, something went wrong.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    return (
      <div className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'} mb-4`}>
        <div className="chat-image avatar">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {message.sender === 'agent' ? (
              <Image
                src="/images/caballoloko.png"
                alt="CaballoLoko"
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <FaUser />
              </div>
            )}
          </div>
        </div>
        <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'} max-w-[80%]`}>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="rounded-md overflow-hidden my-2">
                    <div className="bg-gray-800 text-gray-200 px-4 py-1 text-sm flex justify-between items-center">
                      <span>{match[1]}</span>
                    </div>
                    <SyntaxHighlighter
                      language={match[1]}
                      style={vscDarkPlus as any}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-gray-800 text-gray-200 px-1 rounded" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-2">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container bg-base-200 p-4 rounded-lg shadow-lg h-[80vh] flex flex-col">
      {!isServiceReady && (
        <div className="alert alert-warning mb-4">
          Chat service is initializing... Please wait.
        </div>
      )}
      <div className="messages flex-grow overflow-y-auto mb-4 p-4 bg-base-100 rounded-lg">
        {messages.map((message, index) => (
          <div key={index}>
            {renderMessage(message)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-section flex bg-base-100 p-2 rounded-lg">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message... (Shift + Enter for new line)"
          className="textarea textarea-bordered flex-grow mr-2 min-h-[2.5rem] max-h-32"
          disabled={!isServiceReady || isLoading}
          rows={1}
        />
        <button 
          onClick={handleSend} 
          disabled={!isServiceReady || isLoading} 
          className="btn btn-primary self-end"
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

export default CaballoLoko;