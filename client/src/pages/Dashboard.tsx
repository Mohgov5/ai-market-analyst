// src/pages/Dashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, ExternalLink, Filter, Clock, Activity, Zap, DollarSign, LineChart as LineChartIcon, BarChart } from 'lucide-react';
import { useTheme } from '../Context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Line } from 'recharts';
import { currencyService, Currency } from '../services/currency.service';
import { analysisService } from '../services/analysis.service';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  reliability: 'high' | 'medium' | 'low';
  sentiment: number;
}

interface MarketAnalysis {
  crypto_trend: number;
  fiat_trend: number;
  overall_sentiment: number;
  top_performers: Currency[];
  recommendations: {
    currency: Currency;
    action: string;
    reason: string;
  }[];
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [cryptoList, setCryptoList] = useState<Currency[]>([]);
  const [fiatList, setFiatList] = useState<Currency[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'linear' | 'candlestick'>('linear');
  
  // Filter states
  const [cryptoFilterOpen, setCryptoFilterOpen] = useState(false);
  const [cryptoSortBy, setCryptoSortBy] = useState<'name' | 'price' | 'change24h' | 'volume24h' | 'popularity'>('popularity');
  const [cryptoSortOrder, setCryptoSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [fiatFilterOpen, setFiatFilterOpen] = useState(false);
  const [fiatSortBy, setFiatSortBy] = useState<'name' | 'price' | 'change24h' | 'volume24h' | 'popularity'>('popularity');
  const [fiatSortOrder, setFiatSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [currencyListTab, setCurrencyListTab] = useState<'all' | 'crypto' | 'fiat'>('all');
  
  // Refs for dropdown positioning
  const cryptoFilterRef = useRef<HTMLDivElement>(null);
  const fiatFilterRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch cryptocurrencies
        const cryptos = await currencyService.getCryptocurrencies();
        setCryptoList(cryptos);
        
        // Fetch FIAT currencies
        const fiats = await currencyService.getFiatCurrencies();
        setFiatList(fiats);
        
        // Fetch market analysis
        const analysis = await analysisService.getMarketAnalysis();
        setMarketAnalysis(analysis);
        
        // Fetch Bitcoin price history for the main chart
        const bitcoinHistory = await currencyService.getCurrencyPriceHistory({
          id: 'bitcoin',
          timeframe: '1w', // Default timeframe
          limit: 100
        });
        
        // Enhance chart data for candlestick visualization
        const enhancedHistory = enhanceChartData(bitcoinHistory);
        setChartData(enhancedHistory);
        
        // Mock news items (could be replaced with a real news API)
        setNewsItems([
          { title: "Bitcoin Breaks Key Resistance Level at $40,000", source: "Bloomberg", time: "2h ago", reliability: "high", sentiment: 0.78 },
          { title: "ECB Considers Interest Rate Cut Amid Declining Inflation", source: "Reuters", time: "4h ago", reliability: "high", sentiment: 0.42 },
          { title: "Solana Gains Momentum With New DeFi Protocols Launch", source: "CoinDesk", time: "6h ago", reliability: "medium", sentiment: 0.65 },
          { title: "Dollar Strengthens Against Major Currencies On Fed Comments", source: "Financial Times", time: "1d ago", reliability: "high", sentiment: 0.32 },
          { title: "Market Volatility Expected To Increase, Analysts Say", source: "Yahoo Finance", time: "1d ago", reliability: "medium", sentiment: -0.24 }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Remove timeframe dependency since we no longer have that toggle in the header
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cryptoFilterRef.current && !cryptoFilterRef.current.contains(event.target as Node)) {
        setCryptoFilterOpen(false);
      }
      if (fiatFilterRef.current && !fiatFilterRef.current.contains(event.target as Node)) {
        setFiatFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Helper function to enhance chart data with candlestick properties
  const enhanceChartData = (data: any[]) => {
    return data.map((point, index, arr) => {
      if (index === 0) {
        return {
          ...point,
          open: point.price * 0.998,
          high: point.price * 1.005,
          low: point.price * 0.995
        };
      }
      
      const prevPoint = arr[index - 1];
      const open = prevPoint.price;
      const close = point.price;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      return {
        ...point,
        open,
        high,
        low
      };
    });
  };
  
  // Get sorted crypto list
  const sortedCryptoList = useMemo(() => {
    return [...cryptoList].sort((a, b) => {
      const multiplier = cryptoSortOrder === 'asc' ? 1 : -1;
      
      if (cryptoSortBy === 'name') {
        return multiplier * a.name.localeCompare(b.name);
      } else if (cryptoSortBy === 'price') {
        return multiplier * ((a.price || 0) - (b.price || 0));
      } else if (cryptoSortBy === 'change24h') {
        return multiplier * (a.change24h - b.change24h);
      } else if (cryptoSortBy === 'popularity' || cryptoSortBy === 'volume24h') {
        // For popularity, we use volume as a proxy
        return multiplier * ((a.volume24h || 0) - (b.volume24h || 0));
      } else {
        return 0;
      }
    });
  }, [cryptoList, cryptoSortBy, cryptoSortOrder]);
  
  // Get sorted FIAT list
  const sortedFiatList = useMemo(() => {
    return [...fiatList].sort((a, b) => {
      const multiplier = fiatSortOrder === 'asc' ? 1 : -1;
      
      if (fiatSortBy === 'name') {
        return multiplier * a.name.localeCompare(b.name);
      } else if (fiatSortBy === 'price') {
        return multiplier * ((a.price || 0) - (b.price || 0));
      } else if (fiatSortBy === 'change24h') {
        return multiplier * (a.change24h - b.change24h);
      } else if (fiatSortBy === 'popularity' || fiatSortBy === 'volume24h') {
        // For popularity, we use volume as a proxy
        return multiplier * ((a.volume24h || 0) - (b.volume24h || 0));
      } else {
        return 0;
      }
    });
  }, [fiatList, fiatSortBy, fiatSortOrder]);
  
  // Get filtered currencies for the main table
  const filteredCurrencies = useMemo(() => {
    if (currencyListTab === 'all') {
      return [...cryptoList, ...fiatList].slice(0, 5);
    } else if (currencyListTab === 'crypto') {
      return cryptoList.slice(0, 5);
    } else {
      return fiatList.slice(0, 5);
    }
  }, [currencyListTab, cryptoList, fiatList]);
  
  // Format price with commas and appropriate decimal places
  const formatPrice = (price: number): string => {
    if (!price && price !== 0) return 'N/A';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Format large numbers with abbreviations
  const formatLargeNumber = (num: number | undefined): string => {
    if (!num && num !== 0) return 'N/A';
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };
  
  // Get sentiment color and label
  const getSentimentColor = (sentiment: number | undefined): string => {
    if (!sentiment && sentiment !== 0) return 'text-gray-400';
    if (sentiment > 0.5) return 'text-green-500';
    if (sentiment > 0 && sentiment <= 0.5) return 'text-emerald-400';
    if (sentiment === 0) return 'text-gray-400';
    if (sentiment >= -0.5) return 'text-amber-400';
    return 'text-red-500';
  };
  
  const getSentimentLabel = (sentiment: number | undefined): string => {
    if (!sentiment && sentiment !== 0) return 'Unknown';
    if (sentiment > 0.6) return 'Very Bullish';
    if (sentiment > 0.2) return 'Bullish';
    if (sentiment >= -0.2 && sentiment <= 0.2) return 'Neutral';
    if (sentiment >= -0.6) return 'Bearish';
    return 'Very Bearish';
  };
  
  // Get recommendation action and color
  const getRecommendation = (change: number, sentiment: number | undefined) => {
    if (!sentiment && sentiment !== 0) {
      sentiment = 0;
    }
    
    const combinedSignal = (change / 10) + sentiment;
    
    if (combinedSignal > 0.5) return { action: 'Buy', color: 'bg-green-500' };
    if (combinedSignal > 0.1) return { action: 'Buy (Weak)', color: 'bg-green-400' };
    if (combinedSignal >= -0.1 && combinedSignal <= 0.1) return { action: 'Hold', color: 'bg-blue-400' };
    if (combinedSignal >= -0.5) return { action: 'Sell (Weak)', color: 'bg-red-400' };
    return { action: 'Sell', color: 'bg-red-500' };
  };
  
  // Chart rendering functions
  const renderCandlestickChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="timestamp" 
            tick={{fontSize: 10}} 
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 10}}
            tickFormatter={(value) => `$${formatPrice(value)}`}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <Tooltip 
            formatter={(value) => {
              if (typeof value === 'number') {
                return [`$${formatPrice(value)}`, ''];
              }
              return ['N/A', ''];
            }}
            labelFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return `Date: ${date.toLocaleDateString()}`;
            }}
            contentStyle={{ 
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '0.375rem',
              color: theme === 'dark' ? '#f9fafb' : '#111827'
            }}
          />
          
          {/* High-Low line */}
          <Line 
            type="monotone" 
            dataKey="high" 
            stroke="transparent" 
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            stroke="transparent" 
            dot={false}
          />
          
          {/* Candlestick bars with custom styling */}
          {chartData.map((entry, index) => {
            const isIncreasing = entry.price >= (entry.open || 0);
            const fill = isIncreasing ? '#10b981' : '#ef4444';
            
            return (
              <React.Fragment key={`candle-${index}`}>
                {/* The candle body */}
                <Bar 
                  dataKey="price" 
                  fill={fill} 
                  stroke={fill}
                  strokeWidth={1}
                  barSize={6}
                  radius={[0, 0, 0, 0]}
                />
              </React.Fragment>
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderLinearChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="timestamp"
            tick={{fontSize: 10}}
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 10}}
            tickFormatter={(value) => `$${formatPrice(value)}`}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <Tooltip 
            formatter={(value) => {
              if (typeof value === 'number') {
                return [`$${formatPrice(value)}`, 'Price'];
              }
              return ['N/A', 'Price'];
            }}
            labelFormatter={(timestamp) => `Date: ${new Date(timestamp).toLocaleString()}`}
            contentStyle={{ 
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '0.375rem',
              color: theme === 'dark' ? '#f9fafb' : '#111827'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#06b6d4" 
            fillOpacity={1} 
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Market Overview</h2>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - News Feed */}
        <div className="col-span-1">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Clock className="mr-2 text-primary-500" size={18} />
              Latest Market News
            </h3>
            <div className="space-y-4">
              {newsItems.map((news, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition cursor-pointer`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{news.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentColor(news.sentiment)} bg-opacity-20`}>
                      {getSentimentLabel(news.sentiment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${news.reliability === 'high' ? 'text-green-400' : news.reliability === 'medium' ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {news.source}
                    </span>
                    <span className="text-xs text-gray-400">{news.time}</span>
                  </div>
                </div>
              ))}
              <Link 
                to="/news"
                className={`w-full py-2 text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition flex items-center justify-center block`}
              >
                <ExternalLink size={14} className="mr-2" />
                View All News
              </Link>
            </div>
          </div>
        </div>
        
        {/* Middle Column - Market Summary */}
        <div className="col-span-1">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Top Cryptocurrencies</h3>
              <div className="relative" ref={cryptoFilterRef}>
                <button 
                  onClick={() => setCryptoFilterOpen(!cryptoFilterOpen)}
                  className="text-xs text-primary-500 flex items-center"
                >
                  <Filter size={12} className="mr-1" />
                  Filter
                </button>
                {cryptoFilterOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCryptoSortBy('popularity');
                          setCryptoSortOrder(cryptoSortOrder === 'asc' ? 'desc' : 'asc');
                          setCryptoFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${cryptoSortBy === 'popularity' ? 'font-bold' : ''}`}
                      >
                        Sort by Popularity {cryptoSortBy === 'popularity' && (cryptoSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setCryptoSortBy('name');
                          setCryptoSortOrder(cryptoSortOrder === 'asc' ? 'desc' : 'asc');
                          setCryptoFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${cryptoSortBy === 'name' ? 'font-bold' : ''}`}
                      >
                        Sort by Name {cryptoSortBy === 'name' && (cryptoSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setCryptoSortBy('price');
                          setCryptoSortOrder(cryptoSortOrder === 'asc' ? 'desc' : 'asc');
                          setCryptoFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${cryptoSortBy === 'price' ? 'font-bold' : ''}`}
                      >
                        Sort by Price {cryptoSortBy === 'price' && (cryptoSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setCryptoSortBy('change24h');
                          setCryptoSortOrder(cryptoSortOrder === 'asc' ? 'desc' : 'asc');
                          setCryptoFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${cryptoSortBy === 'change24h' ? 'font-bold' : ''}`}
                      >
                        Sort by 24h Change {cryptoSortBy === 'change24h' && (cryptoSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setCryptoSortBy('volume24h');
                          setCryptoSortOrder(cryptoSortOrder === 'asc' ? 'desc' : 'asc');
                          setCryptoFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${cryptoSortBy === 'volume24h' ? 'font-bold' : ''}`}
                      >
                        Sort by Volume {cryptoSortBy === 'volume24h' && (cryptoSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {sortedCryptoList.slice(0, 3).map((crypto, index) => (
                <Link 
                  key={index}
                  to={`/crypto/${crypto.id}`}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-between cursor-pointer transition block`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${
                      crypto.symbol === 'BTC' ? 'bg-orange-500' : 
                      crypto.symbol === 'ETH' ? 'bg-purple-500' : 
                      crypto.symbol === 'BNB' ? 'bg-yellow-500' :
                      crypto.symbol === 'SOL' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}>
                      {crypto.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-xs text-gray-400">{crypto.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">${formatPrice(crypto.price)}</p>
                    <p className={`text-xs ${crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-end`}>
                      {crypto.change24h >= 0 ? <ArrowUp size={10} className="mr-1" /> : <ArrowDown size={10} className="mr-1" />}
                      {Math.abs(crypto.change24h)}%
                    </p>
                  </div>
                </Link>
              ))}
              <Link 
                to="/crypto"
                className={`w-full py-2 text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition flex items-center justify-center block`}
              >
                <ExternalLink size={14} className="mr-2" />
                View All Cryptocurrencies
              </Link>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Top FIAT Currencies</h3>
              <div className="relative" ref={fiatFilterRef}>
                <button 
                  onClick={() => setFiatFilterOpen(!fiatFilterOpen)}
                  className="text-xs text-primary-500 flex items-center"
                >
                  <Filter size={12} className="mr-1" />
                  Filter
                </button>
                {fiatFilterOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setFiatSortBy('popularity');
                          setFiatSortOrder(fiatSortOrder === 'asc' ? 'desc' : 'asc');
                          setFiatFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${fiatSortBy === 'popularity' ? 'font-bold' : ''}`}
                      >
                        Sort by Popularity {fiatSortBy === 'popularity' && (fiatSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setFiatSortBy('name');
                          setFiatSortOrder(fiatSortOrder === 'asc' ? 'desc' : 'asc');
                          setFiatFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${fiatSortBy === 'name' ? 'font-bold' : ''}`}
                      >
                        Sort by Name {fiatSortBy === 'name' && (fiatSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setFiatSortBy('price');
                          setFiatSortOrder(fiatSortOrder === 'asc' ? 'desc' : 'asc');
                          setFiatFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${fiatSortBy === 'price' ? 'font-bold' : ''}`}
                      >
                        Sort by Price {fiatSortBy === 'price' && (fiatSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setFiatSortBy('change24h');
                          setFiatSortOrder(fiatSortOrder === 'asc' ? 'desc' : 'asc');
                          setFiatFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${fiatSortBy === 'change24h' ? 'font-bold' : ''}`}
                      >
                        Sort by 24h Change {fiatSortBy === 'change24h' && (fiatSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => {
                          setFiatSortBy('volume24h');
                          setFiatSortOrder(fiatSortOrder === 'asc' ? 'desc' : 'asc');
                          setFiatFilterOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        } ${fiatSortBy === 'volume24h' ? 'font-bold' : ''}`}
                      >
                        Sort by Volume {fiatSortBy === 'volume24h' && (fiatSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {sortedFiatList.slice(0, 3).map((fiat, index) => (
                <Link 
                  key={index}
                  to={`/fiat/${fiat.id}`}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-between cursor-pointer transition block`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-green-600`}>
                      {fiat.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{fiat.name}</p>
                      <p className="text-xs text-gray-400">{fiat.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">${formatPrice(fiat.price)}</p>
                    <p className={`text-xs ${fiat.change24h >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-end`}>
                      {fiat.change24h >= 0 ? <ArrowUp size={10} className="mr-1" /> : <ArrowDown size={10} className="mr-1" />}
                      {Math.abs(fiat.change24h)}%
                    </p>
                  </div>
                </Link>
              ))}
              <Link 
                to="/fiat"
                className={`w-full py-2 text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition flex items-center justify-center block`}
              >
                <ExternalLink size={14} className="mr-2" />
                View All FIAT Currencies
              </Link>
            </div>
          </div>
        </div>
        
        {/* Right Column - Market Analysis */}
        <div className="col-span-1">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg h-full`}>
            <h3 className="text-lg font-bold mb-4">AI Market Analysis</h3>
            
            {/* Bitcoin Chart with Chart Type Toggle */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Bitcoin (BTC) Overview</h4>
                
                {/* Chart Type Toggle */}
                <div className={`p-0.5 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex`}>
                  <button
                    onClick={() => setChartType('linear')}
                    className={`px-2 py-1 rounded-md text-xs flex items-center ${
                      chartType === 'linear' 
                        ? 'bg-primary-500 text-white' 
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    } transition`}
                  >
                    <LineChartIcon size={12} className="mr-1" />
                    Linear
                  </button>
                  <button
                    onClick={() => setChartType('candlestick')}
                    className={`px-2 py-1 rounded-md text-xs flex items-center ${
                      chartType === 'candlestick' 
                        ? 'bg-primary-500 text-white' 
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    } transition`}
                  >
                    <BarChart size={12} className="mr-1" />
                    Candle
                  </button>
                </div>
              </div>
              
              <div className="h-44">
                {chartData.length > 0 ? (
                  chartType === 'linear' ? renderLinearChart() : renderCandlestickChart()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No price data available</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <h4 className="text-sm font-semibold mb-2 flex items-center">
                <Zap size={16} className="mr-1 text-primary-500" />
                Market Trend Analysis
              </h4>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Crypto Market Trend</span>
                  <span className="text-xs font-bold text-green-500">
                    {marketAnalysis ? 
                      (marketAnalysis.crypto_trend > 0.2 ? 'Bullish' : 
                      marketAnalysis.crypto_trend > -0.2 ? 'Neutral' : 'Bearish') 
                      : 'Loading...'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`${
                      marketAnalysis && marketAnalysis.crypto_trend > 0 ? 'bg-green-500' : 
                      marketAnalysis && marketAnalysis.crypto_trend === 0 ? 'bg-blue-500' : 
                      'bg-red-500'
                    } h-1.5 rounded-full`}
                    style={{ 
                      width: marketAnalysis ? 
                        `${50 + (marketAnalysis.crypto_trend * 50)}%` : '50%' 
                    }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">FIAT Market Trend</span>
                  <span className="text-xs font-bold text-amber-400">
                    {marketAnalysis ? 
                      (marketAnalysis.fiat_trend > 0.2 ? 'Bullish' : 
                      marketAnalysis.fiat_trend > -0.2 ? 'Neutral' : 'Bearish') 
                      : 'Loading...'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`${
                      marketAnalysis && marketAnalysis.fiat_trend > 0 ? 'bg-green-500' : 
                      marketAnalysis && marketAnalysis.fiat_trend === 0 ? 'bg-amber-400' : 
                      'bg-red-500'
                    } h-1.5 rounded-full`}
                    style={{ 
                      width: marketAnalysis ? 
                        `${50 + (marketAnalysis.fiat_trend * 50)}%` : '50%' 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Overall Sentiment</span>
                  <span className="text-xs font-bold text-green-400">
                    {marketAnalysis ? getSentimentLabel(marketAnalysis.overall_sentiment) : 'Loading...'}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`${getSentimentColor(marketAnalysis?.overall_sentiment).replace('text-', 'bg-')} h-1.5 rounded-full`}
                    style={{ 
                      width: marketAnalysis ? 
                        `${50 + (marketAnalysis.overall_sentiment * 50)}%` : '50%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <h4 className="text-sm font-semibold mb-2 flex items-center">
                <Activity size={16} className="mr-1 text-primary-500" />
                Top Performing Assets
              </h4>
              <div className="space-y-2">
                {marketAnalysis && marketAnalysis.top_performers ? (
                  marketAnalysis.top_performers.slice(0, 3).map((asset, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full ${
                          asset.symbol === 'BTC' ? 'bg-orange-500' : 
                          asset.symbol === 'ETH' ? 'bg-purple-500' : 
                          asset.symbol === 'SOL' ? 'bg-green-500' :
                          asset.symbol === 'USD' ? 'bg-green-600' :
                          'bg-blue-500'
                        } flex items-center justify-center text-xs font-bold mr-2`}>
                          {asset.symbol.charAt(0)}
                        </div>
                        <span className="text-sm">{asset.name} ({asset.symbol})</span>
                      </div>
                      <span className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                        {asset.change24h >= 0 ? <ArrowUp size={10} className="mr-1" /> : <ArrowDown size={10} className="mr-1" />}
                        {Math.abs(asset.change24h).toFixed(2)}%
                      </span>
                    </div>
                  ))
                ) : (
                  // Fallback top performers
                  <>
                    {cryptoList.slice(0, 2).concat(fiatList[0])
                      .sort((a, b) => b.change24h - a.change24h)
                      .map((asset, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full ${
                              asset.symbol === 'BTC' ? 'bg-orange-500' : 
                              asset.symbol === 'ETH' ? 'bg-purple-500' : 
                              asset.symbol === 'SOL' ? 'bg-green-500' :
                              asset.type === 'fiat' ? 'bg-green-600' :
                              'bg-blue-500'
                            } flex items-center justify-center text-xs font-bold mr-2`}>
                              {asset.symbol.charAt(0)}
                            </div>
                            <span className="text-sm">{asset.name} ({asset.symbol})</span>
                          </div>
                          <span className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {asset.change24h >= 0 ? <ArrowUp size={10} className="mr-1" /> : <ArrowDown size={10} className="mr-1" />}
                            {Math.abs(asset.change24h).toFixed(2)}%
                          </span>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="text-sm font-semibold mb-2 flex items-center">
                <DollarSign size={16} className="mr-1 text-primary-500" />
                AI Recommended Actions
              </h4>
              <div className="space-y-3">
                {marketAnalysis && marketAnalysis.recommendations ? (
                  marketAnalysis.recommendations.slice(0, 3).map((rec, index) => {
                    const recommendation = getRecommendation(rec.currency.change24h, rec.currency.sentiment);
                    return (
                      <div key={index} className={`p-2 rounded bg-opacity-20 border-l-4 ${
                        rec.action.toLowerCase().includes('buy') ? 'bg-green-500 border-green-500' :
                        rec.action.toLowerCase().includes('hold') ? 'bg-blue-500 border-blue-500' :
                        'bg-red-500 border-red-500'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{rec.currency.name} ({rec.currency.symbol})</span>
                          <span className={`text-xs font-bold ${
                            rec.action.toLowerCase().includes('buy') ? 'text-green-500' :
                            rec.action.toLowerCase().includes('hold') ? 'text-blue-500' :
                            'text-red-500'
                          }`}>{rec.action}</span>
                        </div>
                        <p className="text-xs mt-1 text-gray-400">{rec.reason}</p>
                      </div>
                    );
                  })
                ) : (
                  // Fallback recommendations
                  <>
                    <div className={`p-2 rounded bg-green-500 bg-opacity-20 border-l-4 border-green-500`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Bitcoin (BTC)</span>
                        <span className="text-xs font-bold text-green-500">Buy</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-400">Strong technical indicators with positive sentiment.</p>
                    </div>
                    <div className={`p-2 rounded bg-blue-500 bg-opacity-20 border-l-4 border-blue-500`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Ethereum (ETH)</span>
                        <span className="text-xs font-bold text-blue-500">Hold</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-400">Mixed signals with decreasing volatility.</p>
                    </div>
                    <div className={`p-2 rounded bg-red-500 bg-opacity-20 border-l-4 border-red-500`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Cardano (ADA)</span>
                        <span className="text-xs font-bold text-red-500">Sell</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-400">Bearish pattern forming with decreasing volume.</p>
                    </div>
                  </>
                )}
              </div>
              <Link
                to="/recommendations"
                className={`w-full mt-3 py-2 text-xs ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded transition flex items-center justify-center block`}
              >
                View All Recommendations
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Currency List */}
      <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">All Currencies</h3>
          <div className="flex items-center">
            <button 
              onClick={() => setCurrencyListTab('all')}
              className={`px-3 py-1 rounded-md mr-2 ${
                currencyListTab === 'all' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              } text-sm`}
            >
              All
            </button>
            <button 
              onClick={() => setCurrencyListTab('crypto')}
              className={`px-3 py-1 rounded-md mr-2 ${
                currencyListTab === 'crypto' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              } text-sm`}
            >
              Crypto
            </button>
            <button 
              onClick={() => setCurrencyListTab('fiat')}
              className={`px-3 py-1 rounded-md ${
                currencyListTab === 'fiat' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              } text-sm`}
            >
              FIAT
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Name</th>
                <th className="text-right p-3 text-sm font-semibold">Price</th>
                <th className="text-right p-3 text-sm font-semibold">24h Change</th>
                <th className="text-right p-3 text-sm font-semibold">Volume</th>
                <th className="text-right p-3 text-sm font-semibold">AI Sentiment</th>
                <th className="text-right p-3 text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCurrencies.map((currency, index) => (
                <tr 
                  key={index}
                  className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${
                        currency.symbol === 'BTC' ? 'bg-orange-500' : 
                        currency.symbol === 'ETH' ? 'bg-purple-500' : 
                        currency.symbol === 'SOL' ? 'bg-green-500' :
                        currency.symbol === 'USD' ? 'bg-green-600' :
                        currency.symbol === 'EUR' ? 'bg-blue-500' :
                        'bg-cyan-500'
                      }`}>
                        {currency.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{currency.name}</p>
                        <p className="text-xs text-gray-400">{currency.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium">${formatPrice(currency.price)}</td>
                  <td className={`p-3 text-right font-medium ${currency.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <div className="flex items-center justify-end">
                      {currency.change24h >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                      {Math.abs(currency.change24h).toFixed(2)}%
                    </div>
                  </td>
                  <td className="p-3 text-right text-sm">{formatLargeNumber(currency.volume24h)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(currency.sentiment)}`}>
                      {getSentimentLabel(currency.sentiment)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getRecommendation(currency.change24h, currency.sentiment).color}`}>
                      {getRecommendation(currency.change24h, currency.sentiment).action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-center">
            <Link 
              to={currencyListTab === 'crypto' ? '/crypto' : currencyListTab === 'fiat' ? '/fiat' : '/currencies'}
              className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-sm transition`}
            >
              View All {currencyListTab === 'crypto' ? 'Cryptocurrencies' : currencyListTab === 'fiat' ? 'FIAT Currencies' : 'Currencies'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;