// src/pages/Settings.tsx
import React from 'react';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { Moon, Sun, Bell, Globe, Shield, User } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-400 mt-1">Manage your preferences and account settings</p>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <User className="mr-2 text-primary-500" size={18} />
          Account Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {user?.name || 'User'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {user?.email || 'user@example.com'}
            </div>
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Shield className="mr-2 text-primary-500" size={18} />
          Preferences
        </h3>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {theme === 'dark' ? <Moon size={18} className="mr-3" /> : <Sun size={18} className="mr-3" />}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-gray-400">Toggle between dark and light mode</p>
              </div>
            </div>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`px-3 py-1 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Bell size={18} className="mr-3" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-gray-400">Manage your notification preferences</p>
              </div>
            </div>
            
            <button className={`px-3 py-1 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              Manage
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Globe size={18} className="mr-3" />
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-gray-400">Change your interface language</p>
              </div>
            </div>
            
            <select className={`px-3 py-1 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} border-none focus:outline-none`}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;