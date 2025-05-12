// server/src/services/marketData.service.ts
import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('MarketDataService');

export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply?: number;
  totalSupply?: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
}

export interface FiatData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

export interface PriceHistoryOptions {
  id: string;
  timeframe: '1h' | '1d' | '1w' | '1m' | '1y' | 'all';
  limit?: number;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  volume?: number;
}

class MarketDataService {
  private readonly coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly alphaVantageBaseUrl = 'https://www.alphavantage.co/query';
  
  // CoinGecko API
  async getTopCryptos(limit: number = 100): Promise<CryptoData[]> {
    try {
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: this.coinGeckoApiKey ? {
          'X-CG-Pro-API-Key': this.coinGeckoApiKey
        } : {}
      });
      
      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        symbol: item.symbol.toUpperCase(),
        price: item.current_price,
        change24h: item.price_change_percentage_24h || 0,
        volume24h: item.total_volume,
        marketCap: item.market_cap,
        circulatingSupply: item.circulating_supply,
        totalSupply: item.total_supply,
        allTimeHigh: item.ath,
        allTimeHighDate: item.ath_date
      }));
    } catch (error) {
      logger.error('Error fetching top cryptocurrencies:', error);
      throw new Error('Failed to fetch cryptocurrency data');
    }
  }
  
  async getCryptoDetails(id: string): Promise<CryptoData> {
    try {
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        },
        headers: this.coinGeckoApiKey ? {
          'X-CG-Pro-API-Key': this.coinGeckoApiKey
        } : {}
      });
      
      const data = response.data;
      
      return {
        id: data.id,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        price: data.market_data.current_price.usd,
        change24h: data.market_data.price_change_percentage_24h || 0,
        volume24h: data.market_data.total_volume.usd,
        marketCap: data.market_data.market_cap.usd,
        circulatingSupply: data.market_data.circulating_supply,
        totalSupply: data.market_data.total_supply,
        allTimeHigh: data.market_data.ath.usd,
        allTimeHighDate: data.market_data.ath_date.usd
      };
    } catch (error) {
      logger.error(`Error fetching crypto details for ${id}:`, error);
      throw new Error(`Failed to fetch details for ${id}`);
    }
  }
  
  async getCryptoPriceHistory({ id, timeframe, limit = 100 }: PriceHistoryOptions): Promise<PricePoint[]> {
    try {
      // Map timeframe to CoinGecko parameters
      const days = this.mapTimeframeToDays(timeframe);
      const interval = this.mapTimeframeToInterval(timeframe);
      
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
          interval
        },
        headers: this.coinGeckoApiKey ? {
          'X-CG-Pro-API-Key': this.coinGeckoApiKey
        } : {}
      });
      
      // CoinGecko returns prices, market_caps, and volumes as arrays of [timestamp, value]
      const prices = response.data.prices;
      const volumes = response.data.total_volumes;
      
      return prices.map((item: number[], index: number) => ({
        timestamp: new Date(item[0]).toISOString(),
        price: item[1],
        volume: volumes[index] ? volumes[index][1] : undefined
      })).slice(-limit);
    } catch (error) {
      logger.error(`Error fetching price history for ${id}:`, error);
      throw new Error(`Failed to fetch price history for ${id}`);
    }
  }
  
  // Alpha Vantage API for Forex/FIAT data
  async getTopFiats(limit: number = 20): Promise<FiatData[]> {
    const baseCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD'];
    const quoteCurrency = 'USD';
    
    try {
      // For simplicity, we'll use a predefined list of major currencies
      const results: FiatData[] = [];
      
      for (const currency of baseCurrencies.slice(0, limit)) {
        if (currency === quoteCurrency) {
          // USD/USD would always be 1.0
          results.push({
            id: currency.toLowerCase(),
            name: this.getCurrencyName(currency),
            symbol: currency,
            price: 1.0,
            change24h: 0,
            volume24h: 0
          });
          continue;
        }
        
        // Get the forex quote
        const response = await axios.get(this.alphaVantageBaseUrl, {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: currency,
            to_currency: quoteCurrency,
            apikey: process.env.ALPHA_VANTAGE_API_KEY
          }
        });
        
        const data = response.data['Realtime Currency Exchange Rate'];
        
        if (data) {
          const price = parseFloat(data['5. Exchange Rate']);
          
          // For change24h, we'd need to make another call to get historical data
          // This is simplified for now
          results.push({
            id: currency.toLowerCase(),
            name: this.getCurrencyName(currency),
            symbol: currency,
            price,
            change24h: 0, // In a real app, calculate from historical data
            volume24h: 0  // Alpha Vantage doesn't provide volume data easily
          });
        }
        
        // Alpha Vantage has rate limits, so we add a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return results;
    } catch (error) {
      logger.error('Error fetching FIAT currencies:', error);
      throw new Error('Failed to fetch FIAT currency data');
    }
  }
  
  async getFiatDetails(id: string): Promise<FiatData> {
    id = id.toUpperCase();
    const quoteCurrency = 'USD';
    
    try {
      if (id === quoteCurrency) {
        return {
          id: id.toLowerCase(),
          name: this.getCurrencyName(id),
          symbol: id,
          price: 1.0,
          change24h: 0,
          volume24h: 0
        };
      }
      
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: id,
          to_currency: quoteCurrency,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        }
      });
      
      const data = response.data['Realtime Currency Exchange Rate'];
      
      if (!data) {
        throw new Error(`Currency ${id} not found`);
      }
      
      const price = parseFloat(data['5. Exchange Rate']);
      
      return {
        id: id.toLowerCase(),
        name: this.getCurrencyName(id),
        symbol: id,
        price,
        change24h: 0, // Simplified
        volume24h: 0  // Simplified
      };
      
    } catch (error) {
      logger.error(`Error fetching FIAT details for ${id}:`, error);
      throw new Error(`Failed to fetch details for ${id}`);
    }
  }
  
  async getFiatPriceHistory({ id, timeframe, limit = 100 }: PriceHistoryOptions): Promise<PricePoint[]> {
    id = id.toUpperCase();
    const quoteCurrency = 'USD';
    
    try {
      // Map our timeframe to Alpha Vantage's interval
      const outputSize = timeframe === '1y' || timeframe === 'all' ? 'full' : 'compact';
      let interval = '60min'; // Default to hourly
      
      switch (timeframe) {
        case '1d':
          interval = '5min';
          break;
        case '1w':
        case '1m':
          interval = 'daily';
          break;
        case '1y':
        case 'all':
          interval = 'weekly';
          break;
      }
      
      // Different endpoint for intraday vs daily/weekly
      const isIntraday = interval === '5min' || interval === '60min';
      const function_name = isIntraday ? 'FX_INTRADAY' : 'FX_DAILY';
      
      const response = await axios.get(this.alphaVantageBaseUrl, {
        params: {
          function: function_name,
          from_symbol: id,
          to_symbol: quoteCurrency,
          interval: isIntraday ? interval : undefined,
          outputSize,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        }
      });
      
      let timeSeriesKey;
      if (isIntraday) {
        timeSeriesKey = `Time Series FX (${interval})`;
      } else if (interval === 'daily') {
        timeSeriesKey = 'Time Series FX (Daily)';
      } else {
        timeSeriesKey = 'Time Series FX (Weekly)';
      }
      
      const timeSeries = response.data[timeSeriesKey];
      
      if (!timeSeries) {
        throw new Error(`No price history data found for ${id}`);
      }
      
      // Convert the object to an array of price points
      const pricePoints: PricePoint[] = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
          timestamp: new Date(date).toISOString(),
          price: parseFloat(values['4. close']),
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit);
      
      return pricePoints;
      
    } catch (error) {
      logger.error(`Error fetching FIAT price history for ${id}:`, error);
      throw new Error(`Failed to fetch price history for ${id}`);
    }
  }
  
  // Helper methods
  private mapTimeframeToDays(timeframe: string): string {
    switch (timeframe) {
      case '1h': return '1';
      case '1d': return '1';
      case '1w': return '7';
      case '1m': return '30';
      case '1y': return '365';
      case 'all': return 'max';
      default: return '30';
    }
  }
  
  private mapTimeframeToInterval(timeframe: string): string | undefined {
    switch (timeframe) {
      case '1h': return '5m';
      case '1d': return '1h';
      default: return undefined; // Daily data for longer timeframes
    }
  }
  
  private getCurrencyName(symbol: string): string {
    const currencyNames: Record<string, string> = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'JPY': 'Japanese Yen',
      'GBP': 'British Pound',
      'AUD': 'Australian Dollar',
      'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'HKD': 'Hong Kong Dollar',
      'NZD': 'New Zealand Dollar'
    };
    
    return currencyNames[symbol] || symbol;
  }
  
  // API Keys
  private get coinGeckoApiKey(): string | undefined {
    return process.env.COINGECKO_API_KEY;
  }
}

export default new MarketDataService();