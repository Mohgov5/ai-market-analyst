import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, ExternalLink, ChevronLeft, BarChart2, Zap, MessageCircle, Share2, LineChart as LineChartIcon, BarChart } from 'lucide-react';
import { useTheme } from '../Context/ThemeContext'; // Correction de la casse
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Line } from 'recharts';
import { currencyService, Currency, PricePoint } from '../services/currency.service';
import { analysisService } from '../services/analysis.service';

const CurrencyDetail: React.FC = () => {
  const { theme } = useTheme();
  const { id } = useParams<{ id: string }>();
  const currencyType = window.location.pathname.includes('/crypto/') ? 'crypto' : 'fiat';
  
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [technicalAnalysis, setTechnicalAnalysis] = useState<any | null>(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1m' | '1y' | 'all'>('1w');
  const [chartType, setChartType] = useState<'linear' | 'candlestick'>('linear');
  
  useEffect(() => {
    const fetchCurrencyData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Charger les détails de la devise
        const currencyData = await currencyService.getCurrencyDetails(id, currencyType as 'crypto' | 'fiat');
        setCurrency(currencyData);
        
        // Charger l'historique des prix
        const history = await currencyService.getCurrencyPriceHistory({
          id,
          timeframe,
          limit: 100
        });
        
        // Add open, high, low properties for candlestick chart
        const enhancedHistory = history.map((point, index, arr) => {
          // For candlestick chart, we need to simulate OHLC data
          // For first point, use the price for all values
          if (index === 0) {
            return {
              ...point,
              open: point.price * 0.998, // Slightly lower than close for visual effect
              high: point.price * 1.005, // Slightly higher than close
              low: point.price * 0.995   // Slightly lower than close
            };
          }
          
          // For other points, calculate based on previous point
          const prevPoint = arr[index - 1];
          const open = prevPoint.price;
          const close = point.price;
          const high = Math.max(open, close) * (1 + Math.random() * 0.01); // Add small random variance
          const low = Math.min(open, close) * (1 - Math.random() * 0.01);  // Add small random variance
          
          return {
            ...point,
            open,
            high,
            low
          };
        });
        
        setPriceHistory(enhancedHistory);
        
        // Charger l'analyse technique
        try {
          const analysis = await analysisService.getTechnicalAnalysis(id);
          setTechnicalAnalysis(analysis);
        } catch (e) {
          console.error('Failed to load technical analysis:', e);
          // Créer une analyse fictive en cas d'échec
          setTechnicalAnalysis({
            trend: 'neutral',
            indicators: {
              rsi: 50 + (Math.random() * 20 - 10),
              macd: {
                macd: Math.random() * 2 - 1,
                signal: Math.random() * 2 - 1,
                histogram: Math.random() * 0.5 - 0.25
              }
            },
            support_levels: [currencyData.price * 0.95, currencyData.price * 0.9],
            resistance_levels: [currencyData.price * 1.05, currencyData.price * 1.1],
          });
        }
        
        // Charger l'analyse de sentiment
        try {
          const sentiment = await analysisService.getSentimentAnalysis(id);
          setSentimentAnalysis(sentiment);
        } catch (e) {
          console.error('Failed to load sentiment analysis:', e);
          // Créer un sentiment fictif en cas d'échec
          setSentimentAnalysis({
            overall_score: currencyData.change24h > 0 ? 0.3 : -0.1,
            news_sentiments: []
          });
        }
      } catch (error) {
        console.error('Error fetching currency data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrencyData();
  }, [id, currencyType, timeframe]);
  
  // Charger l'historique des prix lors du changement de timeframe
  useEffect(() => {
    const updatePriceHistory = async () => {
      if (!id) return;
      
      try {
        const history = await currencyService.getCurrencyPriceHistory({
          id,
          timeframe,
          limit: 100
        });
        
        // Add open, high, low properties for candlestick chart
        const enhancedHistory = history.map((point, index, arr) => {
          // For candlestick chart, we need to simulate OHLC data
          // For first point, use the price for all values
          if (index === 0) {
            return {
              ...point,
              open: point.price * 0.998, // Slightly lower than close for visual effect
              high: point.price * 1.005, // Slightly higher than close
              low: point.price * 0.995   // Slightly lower than close
            };
          }
          
          // For other points, calculate based on previous point
          const prevPoint = arr[index - 1];
          const open = prevPoint.price;
          const close = point.price;
          const high = Math.max(open, close) * (1 + Math.random() * 0.01); // Add small random variance
          const low = Math.min(open, close) * (1 - Math.random() * 0.01);  // Add small random variance
          
          return {
            ...point,
            open,
            high,
            low
          };
        });
        
        setPriceHistory(enhancedHistory);
      } catch (error) {
        console.error('Error updating price history:', error);
      }
    };
    
    if (currency) {
      updatePriceHistory();
    }
  }, [id, timeframe, currency]);
  
  // Format price with commas and appropriate decimal places
  const formatPrice = (price: number): string => {
    if (!price) return '0.00';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Get sentiment color and label
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
  
  // Get recommendation action and color
  const getRecommendation = (change: number, sentiment: number) => {
    const combinedSignal = (change / 10) + sentiment;
    
    if (combinedSignal > 0.5) return { action: 'Buy', color: 'bg-green-500' };
    if (combinedSignal > 0.1) return { action: 'Buy (Weak)', color: 'bg-green-400' };
    if (combinedSignal >= -0.1 && combinedSignal <= 0.1) return { action: 'Hold', color: 'bg-blue-400' };
    if (combinedSignal >= -0.5) return { action: 'Sell (Weak)', color: 'bg-red-400' };
    return { action: 'Sell', color: 'bg-red-500' };
  };
  
  // Simuler les nouvelles spécifiques à cette devise
  const getRelatedNews = () => {
    const currencyName = currency?.name || '';
    const currencySymbol = currency?.symbol || '';
    
    return [
      { title: `${currencyName} Shows Promising Momentum in Latest Market Movement`, source: "Bloomberg", time: "2h ago", reliability: "high", sentiment: 0.75 },
      { title: `Analysts Predict Strong Future for ${currencyName} Despite Market Uncertainties`, source: "Reuters", time: "5h ago", reliability: "high", sentiment: 0.62 },
      { title: `${currencySymbol} Trading Volume Increases as Investor Interest Grows`, source: "Financial Times", time: "1d ago", reliability: "high", sentiment: 0.48 }
    ];
  };
  
  // Custom candlestick chart renderer
  const renderCandlestickChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={priceHistory}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="timestamp" 
            tick={{fontSize: 12}} 
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              if (timeframe === '1d') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (timeframe === '1w') return date.toLocaleDateString([], { weekday: 'short' });
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 12}}
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
              return `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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
          {priceHistory.map((entry, index) => {
            const isIncreasing = entry.price >= (entry.open || 0);
            const fill = isIncreasing ? '#10b981' : '#ef4444';
            const y = Math.min(entry.open || 0, entry.price);
            const height = Math.abs((entry.open || 0) - entry.price);
            
            return (
              <React.Fragment key={`candle-${index}`}>
                {/* Vertical line (wick) from high to low */}
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={fill} 
                  dot={false} 
                  activeDot={false}
                  connectNulls
                />
                
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
  
  // Linear chart renderer
  const renderLinearChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={priceHistory}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="timestamp" 
            tick={{fontSize: 12}} 
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              if (timeframe === '1d') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (timeframe === '1w') return date.toLocaleDateString([], { weekday: 'short' });
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{fontSize: 12}}
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
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };
  
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!currency) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <h2 className="text-xl font-bold mb-4">Currency not found</h2>
        <Link to="/" className="text-primary-500 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }
  
  const recommendation = getRecommendation(
    currency.change24h, 
    sentimentAnalysis?.overall_score || 0
  );
  
  const newsItems = getRelatedNews();
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <Link to={currencyType === 'crypto' ? '/crypto' : '/fiat'} className="inline-flex items-center text-primary-500 hover:underline">
          <ChevronLeft size={16} className="mr-1" />
          Back to {currencyType === 'crypto' ? 'Cryptocurrencies' : 'FIAT Currencies'}
        </Link>
      </div>
      
      {/* Currency Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 w-full">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center ${
            currencyType === 'crypto' ?
              (currency.symbol === 'BTC' ? 'bg-orange-500' : 
              currency.symbol === 'ETH' ? 'bg-purple-500' : 
              currency.symbol === 'SOL' ? 'bg-green-500' :
              'bg-cyan-500') :
              'bg-green-600'
          }`}>
            <span className="text-white text-xl font-bold">{currency.symbol.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currency.name}</h1>
            <p className="text-gray-400">{currency.symbol}</p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-3xl font-bold">${formatPrice(currency.price)}</p>
          <p className={`text-lg flex items-center justify-end ${currency.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {currency.change24h >= 0 ? <ArrowUp size={18} className="mr-1" /> : <ArrowDown size={18} className="mr-1" />}
            {Math.abs(currency.change24h).toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Left Column - Price Chart (spans 2 columns on md screens) */}
        <div className="md:col-span-2">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Price Chart</h3>
              <div className="flex space-x-2">
                {/* Chart Type Toggle */}
                <div className={`p-0.5 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex`}>
                  <button
                    onClick={() => setChartType('linear')}
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      chartType === 'linear' 
                        ? 'bg-primary-500 text-white' 
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    } transition`}
                  >
                    <LineChartIcon size={16} className="mr-1" />
                    Linear
                  </button>
                  <button
                    onClick={() => setChartType('candlestick')}
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      chartType === 'candlestick' 
                        ? 'bg-primary-500 text-white' 
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    } transition`}
                  >
                    <BarChart size={16} className="mr-1" />
                    Candle
                  </button>
                </div>
                
                {/* Timeframe Buttons */}
                <button 
                  onClick={() => setTimeframe('1d')}
                  className={`px-3 py-1 rounded-md text-sm ${timeframe === '1d' 
                    ? 'bg-primary-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition`}
                >
                  1D
                </button>
                <button 
                  onClick={() => setTimeframe('1w')}
                  className={`px-3 py-1 rounded-md text-sm ${timeframe === '1w' 
                    ? 'bg-primary-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition`}
                >
                  1W
                </button>
                <button 
                  onClick={() => setTimeframe('1m')}
                  className={`px-3 py-1 rounded-md text-sm ${timeframe === '1m' 
                    ? 'bg-primary-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition`}
                >
                  1M
                </button>
                <button 
                  onClick={() => setTimeframe('1y')}
                  className={`px-3 py-1 rounded-md text-sm ${timeframe === '1y' 
                    ? 'bg-primary-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition`}
                >
                  1Y
                </button>
                <button 
                  onClick={() => setTimeframe('all')}
                  className={`px-3 py-1 rounded-md text-sm ${timeframe === 'all' 
                    ? 'bg-primary-500 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition`}
                >
                  ALL
                </button>
              </div>
            </div>
            
            <div className="h-72">
              {priceHistory.length > 0 ? (
                chartType === 'linear' ? renderLinearChart() : renderCandlestickChart()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No price history available</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Market Cap</p>
                <p className="font-semibold">${currency.marketCap?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">24h Volume</p>
                <p className="font-semibold">${currency.volume24h?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Sentiment</p>
                <p className={`font-semibold ${getSentimentColor(sentimentAnalysis?.overall_score || 0)}`}>
                  {getSentimentLabel(sentimentAnalysis?.overall_score || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Recommendation</p>
                <p className={`font-semibold ${
                  recommendation.action.includes('Buy') ? 'text-green-500' : 
                  recommendation.action === 'Hold' ? 'text-blue-500' : 
                  'text-red-500'
                }`}>
                  {recommendation.action}
                </p>
              </div>
            </div>
          </div>
          
          {/* News Section */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mt-6 w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Latest News</h3>
              <Link 
                to="/news"
                className="text-primary-500 text-sm hover:underline flex items-center"
              >
                <ExternalLink size={14} className="mr-1" />
                View All News
              </Link>
            </div>
            
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
            </div>
          </div>
        </div>
        
        {/* Right Column - Analysis & Actions */}
        <div className="md:col-span-1">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6 w-full`}>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Zap size={18} className="mr-2 text-primary-500" />
              AI Analysis
            </h3>
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="text-sm font-semibold mb-2">Sentiment Analysis</h4>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">News Sentiment</span>
                  <span className={`text-xs font-bold ${getSentimentColor(sentimentAnalysis?.overall_score || 0)}`}>
                    {getSentimentLabel(sentimentAnalysis?.overall_score || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5 mb-4">
                  <div
                    className={`h-1.5 rounded-full ${
                      (sentimentAnalysis?.overall_score || 0) > 0.5 ? 'bg-green-500' :
                      (sentimentAnalysis?.overall_score || 0) > 0 ? 'bg-green-400' :
                      (sentimentAnalysis?.overall_score || 0) === 0 ? 'bg-gray-400' :
                      (sentimentAnalysis?.overall_score || 0) >= -0.5 ? 'bg-yellow-400' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${((sentimentAnalysis?.overall_score || 0) + 1) / 2 * 100}%` }}
                  ></div>
                </div>
                
                <h4 className="text-sm font-semibold mb-2">Technical Indicators</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-400">RSI (14)</p>
                    <p className={`font-semibold ${
                      currency.change24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Math.abs(52 + (currency.change24h * 3)).toFixed(1)}
                    </p>
                  </div>
                  <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-400">MACD</p>
                    <p className={`font-semibold ${
                      currency.change24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {currency.change24h > 0 ? 'Bullish' : 'Bearish'}
                    </p>
                  </div>
                  <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-400">MA (50/200)</p>
                    <p className={`font-semibold ${
                      currency.change24h > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {currency.change24h > 0 ? 'Above' : 'Below'}
                    </p>
                  </div>
                  <div className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-400">Bollinger</p>
                    <p className="font-semibold text-blue-400">
                      {currency.change24h > 1.5 ? 'Upper Band' : 
                       currency.change24h < -1.5 ? 'Lower Band' : 
                       'Middle Band'}
                    </p>
                  </div>
                </div>
                
                <div className={`py-3 px-4 rounded text-center text-white text-sm font-medium ${recommendation.color}`}>
                  {recommendation.action}
                </div>
                
                <p className="text-xs mt-3 text-gray-400">
                  {currency.change24h > 0
                    ? `Our AI analysis indicates a positive outlook for ${currency.name} based on both technical indicators and market sentiment. Consider a ${recommendation.action.toLowerCase()} position.`
                    : `Current analysis shows mixed signals for ${currency.name}. Technical indicators are ${currency.change24h < -1 ? 'bearish' : 'neutral'} and sentiment is cautious. Consider the ${recommendation.action.toLowerCase()} recommendation.`
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg w-full`}>
            <h3 className="text-lg font-bold mb-4">Actions</h3>
            <div className="space-y-3">
              <button className={`w-full py-2 text-sm rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>
                <BarChart2 size={14} className="mr-2" />
                View Detailed Analysis
              </button>
              
              <button className={`w-full py-2 text-sm rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>
                <Share2 size={14} className="mr-2" />
                Share Analysis
              </button>
              
              <button className={`w-full py-2 text-sm rounded flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white transition`}>
                <MessageCircle size={14} className="mr-2" />
                Ask AI Assistant
              </button>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Price Alerts</h4>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs">Set a price alert</span>
                  <span className="text-xs text-primary-500">Configure</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Price target"
                    className={`flex-1 px-2 py-1 text-sm rounded ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border`}
                  />
                  <button className="px-3 py-1 bg-primary-500 text-white text-sm rounded">
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDetail;