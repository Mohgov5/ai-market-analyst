// src/hooks/useCurrencyData.ts
import { useState, useEffect } from 'react';

// Types
interface CurrencyData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  marketCap: string;
  sentiment: number;
}

interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

// Simulated data
const generatePriceData = (days = 30, volatility = 0.02, trend = 0.001): PricePoint[] => {
  const startPrice = 35000 + Math.random() * 5000;
  const data: PricePoint[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < days; i++) {
    const change = currentPrice * (volatility * (Math.random() - 0.5) + trend);
    currentPrice += change;
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: currentPrice,
      volume: Math.floor(Math.random() * 10000) + 5000
    });
  }
  
  return data;
};

export const useCurrencyData = (currencyId: string) => {
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock currency data
      const mockCurrencies = [
        { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 39842.51, change: 2.34, volume: '35.8B', marketCap: '789.2B', sentiment: 0.62 },
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: 2187.45, change: -1.21, volume: '18.3B', marketCap: '264.5B', sentiment: 0.31 },
        { id: 'sol', name: 'Solana', symbol: 'SOL', price: 98.65, change: 5.32, volume: '3.8B', marketCap: '42.9B', sentiment: 0.78 },
      ];
      
      const foundCurrency = mockCurrencies.find(c => c.id === currencyId) || mockCurrencies[0];
      setCurrency(foundCurrency);
      
      // Generate price history
      setPriceHistory(generatePriceData());
      
      setLoading(false);
    }, 1000);
  }, [currencyId]);
  
  return { loading, currency, priceHistory };
};