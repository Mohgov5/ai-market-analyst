// src/components/chat/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useTheme } from '../../Context/ThemeContext';

interface ChatBotProps {
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const ChatBot: React.FC<ChatBotProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I'm your AI market assistant. How can I help you with your trading today?",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      // This would be replaced with actual API call in production
      let response = '';
      
      if (input.toLowerCase().includes('bitcoin')) {
        response = "Bitcoin is showing bullish momentum with a 2.34% increase in the last 24 hours. Technical indicators suggest continued uptrend, and sentiment analysis from trusted sources is positive. If you're considering a position, the current market suggests a cautious buy strategy.";
      } else if (input.toLowerCase().includes('ethereum')) {
        response = "Ethereum is currently experiencing mixed signals. While there's some negative price action in the last 24 hours (-1.21%), the overall sentiment remains cautiously positive. Watch for potential support at $2,100.";
      } else {
        response = "I understand your question about the market. Based on current data, market sentiment is moderately bullish across major cryptocurrencies, though FIAT currencies show more neutral patterns. Is there a specific asset you're interested in?";
      }
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <div className={`w-80 h-96 rounded-lg shadow-xl overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex justify-between items-center`}>
        <h3 className="font-medium">AI Assistant</h3>
        <button onClick={onClose} className="focus:outline-none">
          <X size={16} />
        </button>
      </div>
      
      <div className={`flex-1 p-3 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 p-2 rounded-lg ${
              msg.sender === 'user'
                ? 'bg-primary-500 text-white max-w-[80%] ml-auto'
                : theme === 'dark'
                ? 'bg-gray-700 max-w-[80%]'
                : 'bg-gray-100 max-w-[80%]'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className={`mb-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} max-w-[80%]`}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className={`p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex items-center`}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask something about the market..." 
          className={`flex-1 rounded-full px-4 py-2 text-sm outline-none ${
            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
          }`}
        />
        <button 
          onClick={handleSendMessage}
          disabled={input.trim() === '' || isLoading}
          className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center ${
            input.trim() === '' || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-500 hover:bg-primary-600'
          } text-white transition`}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;