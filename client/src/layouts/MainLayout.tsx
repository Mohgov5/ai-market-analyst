import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Search, Bell, User, Sun, Moon, MessageCircle } from 'lucide-react';
import { useTheme } from '../Context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import ChatBot from '../components/chat/ChatBot';

const MainLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    // Root container - CRITICAL: absolute inset-0 ensures it covers the entire viewport
    <div className={`absolute inset-0 flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header - fixed height */}
      <header className={`z-10 py-2 px-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4 focus:outline-none">
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-bold">AI Market Analyst</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center rounded-full px-3 py-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Search size={16} className="mr-2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currencies..."
              className={`bg-transparent border-none focus:outline-none text-sm w-44 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            />
          </div>
          <button className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500">
            <Bell size={18} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="rounded-full bg-primary-500 text-white w-8 h-8 flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
      </header>
      
      {/* Main container - CRITICAL: flex-1 makes it take all remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}
        
        {/* Main content - CRITICAL: flex-1 for width, and overflow-auto for scrolling */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Chat button - fixed position */}
      <div className="fixed bottom-6 right-6 z-10">
        {chatOpen ? (
          <ChatBot onClose={() => setChatOpen(false)} />
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition"
          >
            <MessageCircle size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MainLayout;