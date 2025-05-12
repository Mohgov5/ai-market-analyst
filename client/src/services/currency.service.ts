// src/services/currency.service.ts
import axios from 'axios';

// Types
export interface Currency {
  type: string;
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sentiment?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  allTimeHigh?: number;
  allTimeHighDate?: string;
}

export interface PriceHistoryParams {
  id: string;
  timeframe: '1h' | '1d' | '1w' | '1m' | '1y' | 'all';
  limit?: number;
}

export interface PricePoint {
  open: number;
  timestamp: string;
  price: number;
  volume?: number;
}

class CurrencyService {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest';
  private readonly ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
  
  // Vous pouvez obtenir une clé API gratuite sur https://www.alphavantage.co/support/#api-key
  private readonly ALPHA_VANTAGE_KEY = 'NNYF1KIAGOKANBBG'; // Remplacez par votre clé

  // Récupération des cryptomonnaies
  async getCryptocurrencies(): Promise<Currency[]> {
    try {
      const response = await axios.get(`${this.COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 50,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      return response.data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        sentiment: this.calculateSentiment(coin.price_change_percentage_24h),
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        allTimeHigh: coin.ath,
        allTimeHighDate: coin.ath_date
      }));
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      throw new Error('Failed to fetch cryptocurrencies. Please try again later.');
    }
  }

  // Récupération des devises FIAT
  async getFiatCurrencies(): Promise<Currency[]> {
    try {
      // Récupérer les taux de change par rapport à l'USD
      const response = await axios.get(this.EXCHANGE_RATE_API, {
        params: {
          base: 'USD'
        }
      });

      const rates = response.data.rates;
      const fiatList: Currency[] = [];

      // Liste des devises FIAT majeures (ajoutez-en d'autres si nécessaire)
      const majorFiats = [
        { id: 'usd', name: 'US Dollar', symbol: 'USD' },
        { id: 'eur', name: 'Euro', symbol: 'EUR' },
        { id: 'gbp', name: 'British Pound', symbol: 'GBP' },
        { id: 'jpy', name: 'Japanese Yen', symbol: 'JPY' },
        { id: 'cad', name: 'Canadian Dollar', symbol: 'CAD' },
        { id: 'aud', name: 'Australian Dollar', symbol: 'AUD' },
        { id: 'chf', name: 'Swiss Franc', symbol: 'CHF' },
        { id: 'cny', name: 'Chinese Yuan', symbol: 'CNY' },
        { id: 'sek', name: 'Swedish Krona', symbol: 'SEK' },
        { id: 'nzd', name: 'New Zealand Dollar', symbol: 'NZD' }
      ];

      // Pour les devises FIAT, nous avons besoin des taux d'hier pour calculer le changement en 24h
      // Pour cela, nous allons utiliser l'API Alpha Vantage
      // Note: Alpha Vantage a des limites gratuites strictes (5 requêtes par minute, 500 par jour)
      
      // Pour notre exemple, nous allons simuler un changement de -1% à +1%
      // En production, vous utiliseriez l'API Alpha Vantage pour obtenir des données historiques précises

      for (const fiat of majorFiats) {
        const rate = fiat.symbol === 'USD' ? 1 : rates[fiat.symbol];
        const change24h = (Math.random() * 2 - 1) * 0.5; // Changement simulé entre -0.5% et 0.5%
        
        if (rate) {
          fiatList.push({
            id: fiat.id,
            name: fiat.name,
            symbol: fiat.symbol,
            price: 1 / rate, // Prix en USD
            change24h: change24h,
            volume24h: Math.random() * 1000000000 + 500000000, // Volume simulé
            marketCap: 0, // Les devises FIAT n'ont pas de capitalisation boursière comme les cryptos
            sentiment: this.calculateSentiment(change24h),
            type: ''
          });
        }
      }
      
      return fiatList;
    } catch (error) {
      console.error('Error fetching FIAT currencies:', error);
      throw new Error('Failed to fetch FIAT currencies. Please try again later.');
    }
  }

  // Récupération des détails d'une devise (crypto ou FIAT)
  async getCurrencyDetails(id: string, type: 'crypto' | 'fiat'): Promise<Currency> {
    try {
      if (type === 'crypto') {
        const response = await axios.get(`${this.COINGECKO_API}/coins/${id}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false
          }
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
          sentiment: this.calculateSentiment(data.market_data.price_change_percentage_24h),
          circulatingSupply: data.market_data.circulating_supply,
          totalSupply: data.market_data.total_supply,
          allTimeHigh: data.market_data.ath.usd,
          allTimeHighDate: data.market_data.ath_date?.usd,
          type: 'crypto'
        };
      } else {
        // Pour les devises FIAT, nous utilisons l'API Exchange Rate
        const response = await axios.get(this.EXCHANGE_RATE_API, {
          params: {
            base: id.toUpperCase()
          }
        });
        
        // Pour le changement sur 24h, nous simulons pour cet exemple
        // Dans une application réelle, vous devriez utiliser l'API Alpha Vantage
        const change24h = (Math.random() * 2 - 1) * 0.5; // Entre -0.5% et 0.5%
        
        // Trouver le nom complet de la devise
        const fiatNames: {[key: string]: string} = {
          'usd': 'US Dollar',
          'eur': 'Euro',
          'gbp': 'British Pound',
          'jpy': 'Japanese Yen',
          'cad': 'Canadian Dollar',
          'aud': 'Australian Dollar',
          'chf': 'Swiss Franc',
          'cny': 'Chinese Yuan',
          'sek': 'Swedish Krona',
          'nzd': 'New Zealand Dollar'
        };
        
        const name = fiatNames[id.toLowerCase()] || id.toUpperCase();
        const symbol = id.toUpperCase();
        
        // Calculer le taux par rapport à l'USD
        const usdRate = response.data.rates.USD || 1;
        
        return {
          type: 'fiat',
          id: id.toLowerCase(),
          name,
          symbol,
          price: 1 / usdRate, // Prix en USD
          change24h,
          volume24h: Math.random() * 1000000000 + 500000000, // Volume simulé
          marketCap: 0,
          sentiment: this.calculateSentiment(change24h)
        };
      }
    } catch (error) {
      console.error(`Error fetching details for ${id}:`, error);
      throw new Error(`Failed to fetch details for ${id}. Please try again later.`);
    }
  }

  // Récupération de l'historique des prix
  async getCurrencyPriceHistory({ id, timeframe, limit = 100 }: PriceHistoryParams): Promise<PricePoint[]> {
    try {
      // Convertir le timeframe en jours pour CoinGecko
      const days = this.timeframeToDays(timeframe);
      
      if (this.isCrypto(id)) {
        const response = await axios.get(`${this.COINGECKO_API}/coins/${id}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days,
            interval: days <= 1 ? 'hourly' : days <= 30 ? 'daily' : 'weekly'
          }
        });
        
        const priceData = response.data.prices;
        const volumeData = response.data.total_volumes;
        
        return priceData.map((item: number[], index: number) => ({
          timestamp: new Date(item[0]).toISOString(),
          price: item[1],
          volume: volumeData[index] ? volumeData[index][1] : undefined
        })).slice(-limit);
      } else {
        // Pour les devises FIAT, nous utiliserions idéalement Alpha Vantage
        // Mais pour l'exemple, nous allons générer des données simulées
        // En production, vous remplaceriez cela par une vraie API
        
        const today = new Date();
        const data: PricePoint[] = [];
        
        // Obtenir le prix actuel
        const currentPrice = (await this.getCurrencyDetails(id, 'fiat')).price;
        
        // Générer l'historique
        for (let i = 0; i < Math.min(limit, days); i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - (Math.min(limit, days) - i));
          
          // Fluctuation aléatoire autour du prix actuel
          const randomChange = (Math.random() * 0.06 - 0.03) * currentPrice;
          const price = currentPrice + randomChange;
          
          data.push({
            timestamp: date.toISOString(),
            price,
            volume: Math.random() * 1000000000 + 500000000 // Volume simulé
            ,
            open: 0
          });
        }
        
        return data;
      }
    } catch (error) {
      console.error(`Error fetching price history for ${id}:`, error);
      throw new Error(`Failed to fetch price history for ${id}. Please try again later.`);
    }
  }

  // Méthodes utilitaires
  private timeframeToDays(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 1/24;
      case '1d': return 1;
      case '1w': return 7;
      case '1m': return 30;
      case '1y': return 365;
      case 'all': return 'max' as any;
      default: return 30;
    }
  }
  
  private isCrypto(id: string): boolean {
    // Liste simplifiée, vous pouvez l'étendre
    const fiatCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'sek', 'nzd'];
    return !fiatCurrencies.includes(id.toLowerCase());
  }
  
  private calculateSentiment(change24h: number): number {
    // Convertir le changement de prix en score de sentiment entre -1 et 1
    if (!change24h) return 0;
    
    // Positive sentiment for positive change, negative for negative
    const baseScore = change24h / 10; // Normalize, e.g. 5% change -> 0.5 sentiment
    
    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, baseScore));
  }
}

export const currencyService = new CurrencyService();
export default currencyService;