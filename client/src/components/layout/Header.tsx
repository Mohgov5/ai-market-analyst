// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fermer le menu utilisateur lorsqu'on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implémenter la recherche
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className={`py-2 px-4 border-b flex items-center justify-between 
      ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="mr-4 focus:outline-none">
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold">AI Market Analyst</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch}>
          <div className={`flex items-center rounded-full px-3 py-1
            ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Search size={16} className="mr-2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currencies..."
              className={`bg-transparent border-none focus:outline-none text-sm w-44
                ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            />
          </div>
        </form>
        
        <button className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500">
          <Bell size={18} />
        </button>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        {/* Menu utilisateur */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="rounded-full bg-primary-500 text-white w-8 h-8 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={16} />
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {user?.name}
            </span>
          </button>
          
          {userMenuOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg
              ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} z-10`}>
              <div className="py-1">
                <Link
                  to="/settings"
                  className={`block px-4 py-2 text-sm ${
                    theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  } flex items-center`}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  } flex items-center`}
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;