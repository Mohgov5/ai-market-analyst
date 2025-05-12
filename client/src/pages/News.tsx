// src/pages/News.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../Context/ThemeContext';
import { Clock, ExternalLink, Search } from 'lucide-react';

// Service fictif pour les news (à remplacer par votre service réel)
const getNews = async () => {
  // Simulation d'appel API
  return [
    { id: 1, title: "Bitcoin Breaks Key Resistance Level at $40,000", source: "Bloomberg", time: "2h ago", reliability: "high", sentiment: 0.78, url: "#" },
    { id: 2, title: "ECB Considers Interest Rate Cut Amid Declining Inflation", source: "Reuters", time: "4h ago", reliability: "high", sentiment: 0.42, url: "#" },
    { id: 3, title: "Solana Gains Momentum With New DeFi Protocols Launch", source: "CoinDesk", time: "6h ago", reliability: "medium", sentiment: 0.65, url: "#" },
    { id: 4, title: "Dollar Strengthens Against Major Currencies On Fed Comments", source: "Financial Times", time: "1d ago", reliability: "high", sentiment: 0.32, url: "#" },
    { id: 5, title: "Market Volatility Expected To Increase, Analysts Say", source: "Yahoo Finance", time: "1d ago", reliability: "medium", sentiment: -0.24, url: "#" },
    { id: 6, title: "Ethereum 2.0 Upgrade Timeline Announced", source: "Decrypt", time: "3h ago", reliability: "medium", sentiment: 0.56, url: "#" },
    { id: 7, title: "Central Banks Worldwide Exploring CBDC Options", source: "Bloomberg", time: "5h ago", reliability: "high", sentiment: 0.18, url: "#" },
    { id: 8, title: "NFT Market Sees Resurgence After Months of Decline", source: "CoinDesk", time: "12h ago", reliability: "medium", sentiment: 0.47, url: "#" },
    { id: 9, title: "Global Stocks Fall Amid Economic Uncertainty", source: "Reuters", time: "8h ago", reliability: "high", sentiment: -0.38, url: "#" },
    { id: 10, title: "New Regulations for Crypto Exchanges Proposed", source: "Financial Times", time: "1d ago", reliability: "high", sentiment: -0.12, url: "#" }
  ];
};

const News: React.FC = () => {
  const { theme } = useTheme();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);
  
  // Filtrer les news en fonction de la recherche et du sentiment
  const filteredNews = news.filter(item => {
    // Filtre par texte de recherche
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtre par sentiment
    let matchesSentiment = true;
    if (filter === 'positive') {
      matchesSentiment = item.sentiment > 0.2;
    } else if (filter === 'negative') {
      matchesSentiment = item.sentiment < -0.2;
    } else if (filter === 'neutral') {
      matchesSentiment = item.sentiment >= -0.2 && item.sentiment <= 0.2;
    }
    
    return matchesSearch && matchesSentiment;
  });
  
  // Obtenir la couleur et le label du sentiment
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.5) return 'text-green-500';
    if (sentiment > 0 && sentiment <= 0.5) return 'text-emerald-400';
    if (sentiment === 0) return 'text-gray-400';
    if (sentiment >= -0.5) return 'text-amber-400';
    return 'text-red-500';
  };
  
  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.6) return 'Very Bullish';
    if (sentiment > 0.2) return 'Bullish';
    if (sentiment >= -0.2 && sentiment <= 0.2) return 'Neutral';
    if (sentiment >= -0.6) return 'Bearish';
    return 'Very Bearish';
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Financial News</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtre de sentiment */}
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('positive')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'positive' 
                  ? 'bg-green-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
            >
              Bullish
            </button>
            <button 
              onClick={() => setFilter('neutral')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'neutral' 
                  ? 'bg-blue-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
            >
              Neutral
            </button>
            <button 
              onClick={() => setFilter('negative')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'negative' 
                  ? 'bg-red-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition`}
            >
              Bearish
            </button>
          </div>
          
          {/* Barre de recherche */}
          <div className={`flex items-center rounded-full px-3 py-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Search size={16} className="mr-2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className={`bg-transparent border-none focus:outline-none text-sm w-44 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <a 
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-lg transition cursor-pointer block`}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getSentimentColor(item.sentiment)} bg-opacity-20 whitespace-nowrap`}>
                    {getSentimentLabel(item.sentiment)}
                  </span>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center">
                    <span className={`text-xs ${
                      item.reliability === 'high' ? 'text-green-400' : 
                      item.reliability === 'medium' ? 'text-yellow-400' : 
                      'text-gray-400'
                    }`}>
                      {item.source}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={12} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      
      {filteredNews.length === 0 && !loading && (
        <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg text-center`}>
          <p>No news articles match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default News;