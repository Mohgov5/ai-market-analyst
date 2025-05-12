import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PortfolioValue: React.FC = () => {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<'1w' | '1m' | '3m' | '1y' | 'all'>('1m');
  
  // Generate mock portfolio value data
  const generateData = () => {
    const data = [];
    const now = new Date();
    let daysToGoBack = 30; // Default 1 month
    
    switch (timeframe) {
      case '1w':
        daysToGoBack = 7;
        break;
      case '1m':
        daysToGoBack = 30;
        break;
      case '3m':
        daysToGoBack = 90;
        break;
      case '1y':
        daysToGoBack = 365;
        break;
      case 'all':
        daysToGoBack = 730; // 2 years
        break;
    }
    
    let value = 15000; // Starting value
    
    for (let i = daysToGoBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Add some randomness to the value, but with an overall upward trend
      const randomChange = (Math.random() - 0.45) * 200; // Slightly bias towards positive growth
      value = Math.max(0, value + randomChange);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value,
      });
    }
    
    return data;
  };
  
  const portfolioData = generateData();
  
  // Calculate overall growth
  const startValue = portfolioData[0]?.value || 0;
  const endValue = portfolioData[portfolioData.length - 1]?.value || 0;
  const growthAmount = endValue - startValue;
  const growthPercentage = startValue > 0 ? (growthAmount / startValue) * 100 : 0;
  
  // Format functions
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (timeframe === '1w' || timeframe === '1m') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-semibold">Portfolio Value</h4>
          <div className="flex items-center mt-1">
            <span className="text-xl font-bold mr-2">
              {formatCurrency(endValue)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full flex items-center ${growthAmount >= 0 ? 'bg-green-500 bg-opacity-10 text-green-500' : 'bg-red-500 bg-opacity-10 text-red-500'}`}>
              {growthAmount >= 0 ? '+' : ''}{formatCurrency(growthAmount)} ({growthPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => setTimeframe('1w')}
            className={`px-2 py-1 text-xs rounded ${timeframe === '1w' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            1W
          </button>
          <button
            onClick={() => setTimeframe('1m')}
            className={`px-2 py-1 text-xs rounded ${timeframe === '1m' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            1M
          </button>
          <button
            onClick={() => setTimeframe('3m')}
            className={`px-2 py-1 text-xs rounded ${timeframe === '3m' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            3M
          </button>
          <button
            onClick={() => setTimeframe('1y')}
            className={`px-2 py-1 text-xs rounded ${timeframe === '1y' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            1Y
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-2 py-1 text-xs rounded ${timeframe === 'all' ? 'bg-primary-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            ALL
          </button>
        </div>
      </div>
      
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolioData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="date" 
              tick={{fontSize: 12}} 
              tickFormatter={formatDate}
              axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
              tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{fontSize: 12}}
              tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
              tickLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                color: theme === 'dark' ? '#f9fafb' : '#111827'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#06b6d4" 
              fillOpacity={1} 
              fill="url(#colorValue)"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioValue;