// src/pages/Watchlist.tsx
import React from 'react';
import { useTheme } from '../Context/ThemeContext';

const Watchlist: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Your Watchlist</h2>
        <p className="text-gray-400 mt-1">Track your favorite currencies in one place</p>
      </div>
      
      <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg text-center`}>
        <p className="mb-4">You haven't added any currencies to your watchlist yet.</p>
        <p>Browse crypto and FIAT currencies and click "Add to Watchlist" to start tracking them here.</p>
      </div>
    </div>
  );
};

export default Watchlist;