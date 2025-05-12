import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, DollarSign, Globe, Eye, Award, Activity, Settings, Wallet } from 'lucide-react';
import { useTheme } from '../../Context/ThemeContext';

const Sidebar: React.FC = () => {
  const { theme } = useTheme();
  
  const navLinks = [
    { to: '/', icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { to: '/crypto', icon: <DollarSign size={18} />, label: 'Cryptocurrencies' },
    { to: '/fiat', icon: <Globe size={18} />, label: 'FIAT Currencies' },
    { to: '/watchlist', icon: <Eye size={18} />, label: 'Watchlist' },
    { to: '/learn', icon: <Award size={18} />, label: 'Learn' },
    { to: '/analytics', icon: <Activity size={18} />, label: 'Analytics' },
    { to: '/Wallet', icon: <Wallet size={18} />, label: 'Wallet' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];
  
  return (
    // CRITICAL: w-60 gives fixed width, h-full makes it take full height of parent
    <aside className={`w-60 h-full flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
      {/* CRITICAL: flex flex-col h-full makes the inner content take full height with proper layout */}
      <div className="flex flex-col h-full">
        {/* CRITICAL: flex-1 grows to take available space, overflow-y-auto allows scrolling if needed */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-3">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => 
                    `p-2 rounded-lg flex items-center ${
                      isActive 
                        ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800')
                        : 'hover:bg-gray-700 hover:bg-opacity-20'
                    } transition`
                  }
                >
                  <span className={`mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* CRITICAL: This bottom section does not grow with flex-shrink-0 */}
        <div className={`p-4 flex-shrink-0 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Market Sentiment</p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">Fear & Greed Index</span>
              <span className="text-xs font-bold text-green-400">65 - Greed</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-2/3"></div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Global Market Cap</span>
                <span className="text-xs font-bold">$1.98T</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 text-xs flex items-center">
                  +2.7%
                </span>
                <span className="text-xs text-gray-400 ml-2">24h change</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;