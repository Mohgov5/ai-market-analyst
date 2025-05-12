// src/services/news.service.ts
import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('NewsService');

export interface NewsArticle {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: string;
  reliability: 'high' | 'medium' | 'low';
  sentiment?: number;
}

export interface NewsSource {
  id: string;
  name: string;
  reliability: 'high' | 'medium' | 'low';
}

class NewsService {
  private readonly NEWS_API_KEY = process.env.NEWS_API_KEY;
  private readonly NEWS_API = 'https://newsapi.org/v2';
  
  private readonly sourcesReliability: Record<string, 'high' | 'medium' | 'low'> = {
    // High reliability
    'reuters': 'high',
    'bloomberg': 'high',
    'financial-times': 'high',
    'the-wall-street-journal': 'high',
    // Medium reliability
    'cnbc': 'medium',
    'forbes': 'medium',
    'business-insider': 'medium',
    'yahoo-finance': 'medium',
    // Low reliability (or unrated)
    'cointelegraph': 'low',
    'coindesk': 'low'
  };

  /**
   * Get general financial news
   * @param limit Number of news items to return
   * @param category Optional category filter
   */
  async getFinancialNews(limit: number = 10, category?: string): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(`${this.NEWS_API}/top-headlines`, {
        params: {
          category: category || 'business',
          language: 'en',
          pageSize: limit,
          apiKey: this.NEWS_API_KEY
        }
      });

      return response.data.articles.map((article: any) => {
        const sourceName = article.source.name?.toLowerCase() || '';
        const reliability = this.getReliability(sourceName);
        const sentiment = this.calculateSentiment(article.title, article.description);
        
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          reliability,
          sentiment
        };
      });
    } catch (error) {
      logger.error('Error fetching financial news:', error);
      // Si l'API échoue, utiliser des données de secours
      return this.getFallbackNews(limit);
    }
  }

  /**
   * Get news for a specific currency
   * @param currencyId Currency ID
   * @param limit Number of news items to return
   */
  async getCurrencyNews(currencyId: string, limit: number = 5): Promise<NewsArticle[]> {
    try {
      const currencyName = this.getCurrencyName(currencyId);
      const currencySymbol = currencyId.toUpperCase();
      
      const query = `${currencyName} OR ${currencySymbol}`;
      
      const response = await axios.get(`${this.NEWS_API}/everything`, {
        params: {
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: this.NEWS_API_KEY
        }
      });

      return response.data.articles.map((article: any) => {
        const sourceName = article.source.name?.toLowerCase() || '';
        const reliability = this.getReliability(sourceName);
        const sentiment = this.calculateSentiment(article.title, article.description);
        
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          reliability,
          sentiment
        };
      });
    } catch (error) {
      logger.error(`Error fetching news for ${currencyId}:`, error);
      return this.getFallbackCurrencyNews(currencyId, limit);
    }
  }

  /**
   * Search news with a specific query
   * @param query Search query
   * @param limit Number of results to return
   */
  async searchNews(query: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(`${this.NEWS_API}/everything`, {
        params: {
          q: query,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: limit,
          apiKey: this.NEWS_API_KEY
        }
      });

      return response.data.articles.map((article: any) => {
        const sourceName = article.source.name?.toLowerCase() || '';
        const reliability = this.getReliability(sourceName);
        const sentiment = this.calculateSentiment(article.title, article.description);
        
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          reliability,
          sentiment
        };
      });
    } catch (error) {
      logger.error(`Error searching news for "${query}":`, error);
      // Filtrer les actualités de secours qui contiennent la requête
      return this.getFallbackNews(limit).filter(news => 
        news.title.toLowerCase().includes(query.toLowerCase()) || 
        (news.description || '').toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  /**
   * Get available news sources
   */
  async getNewsSources(): Promise<NewsSource[]> {
    try {
      const response = await axios.get(`${this.NEWS_API}/sources`, {
        params: {
          language: 'en',
          category: 'business',
          apiKey: this.NEWS_API_KEY
        }
      });

      return response.data.sources.map((source: any) => ({
        id: source.id,
        name: source.name,
        reliability: this.getReliability(source.id)
      }));
    } catch (error) {
      logger.error('Error fetching news sources:', error);
      // Sources de secours
      return [
        { id: 'bloomberg', name: 'Bloomberg', reliability: 'high' },
        { id: 'reuters', name: 'Reuters', reliability: 'high' },
        { id: 'financial-times', name: 'Financial Times', reliability: 'high' },
        { id: 'cnbc', name: 'CNBC', reliability: 'medium' },
        { id: 'forbes', name: 'Forbes', reliability: 'medium' },
        { id: 'yahoo-finance', name: 'Yahoo Finance', reliability: 'medium' },
        { id: 'business-insider', name: 'Business Insider', reliability: 'medium' },
        { id: 'cointelegraph', name: 'CoinTelegraph', reliability: 'low' },
        { id: 'coindesk', name: 'CoinDesk', reliability: 'low' }
      ];
    }
  }

  // Méthodes utilitaires privées
  private getReliability(source: string): 'high' | 'medium' | 'low' {
    // Recherche directe
    if (this.sourcesReliability[source]) {
      return this.sourcesReliability[source];
    }
    
    // Recherche par mot-clé
    for (const [key, reliability] of Object.entries(this.sourcesReliability)) {
      if (source.includes(key) || key.includes(source)) {
        return reliability;
      }
    }
    
    // Par défaut
    return 'low';
  }
  
  private calculateSentiment(title: string, description: string | null): number {
    // Version simplifiée d'analyse de sentiment
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Mots positifs et négatifs pour une analyse basique
    const positiveWords = [
      'gain', 'gains', 'rise', 'rises', 'rising', 'up', 'upward', 'high', 'higher',
      'increase', 'increases', 'increasing', 'grow', 'grows', 'growing', 'growth',
      'positive', 'strong', 'stronger', 'bullish', 'rally', 'rallies', 'rallying',
      'recover', 'recovers', 'recovering', 'recovery', 'boom', 'booming'
    ];
    
    const negativeWords = [
      'loss', 'losses', 'fall', 'falls', 'falling', 'down', 'downward', 'low', 'lower',
      'decrease', 'decreases', 'decreasing', 'shrink', 'shrinks', 'shrinking',
      'negative', 'weak', 'weaker', 'bearish', 'crash', 'crashes', 'crashing',
      'collapse', 'collapses', 'collapsing', 'recession', 'concern', 'concerns'
    ];
    
    let score = 0;
    
    // Compter les mots positifs
    positiveWords.forEach(word => {
      if (text.includes(word)) {
        score += 0.1;
      }
    });
    
    // Compter les mots négatifs
    negativeWords.forEach(word => {
      if (text.includes(word)) {
        score -= 0.1;
      }
    });
    
    // Limiter le score entre -1 et 1
    return Math.max(-1, Math.min(1, score));
  }
  
  private getCurrencyName(id: string): string {
    const currencyNames: Record<string, string> = {
      'btc': 'Bitcoin',
      'eth': 'Ethereum',
      'sol': 'Solana',
      'ada': 'Cardano',
      'bnb': 'Binance Coin',
      'xrp': 'Ripple',
      'dot': 'Polkadot',
      'doge': 'Dogecoin',
      'usd': 'US Dollar',
      'eur': 'Euro',
      'gbp': 'British Pound',
      'jpy': 'Japanese Yen'
    };
    
    return currencyNames[id.toLowerCase()] || id.toUpperCase();
  }
  
  private getFallbackNews(limit: number): NewsArticle[] {
    const now = new Date();
    
    const fallbackNews: NewsArticle[] = [
      {
        title: "Global Markets Show Recovery Signs Amid Positive Economic Data",
        description: "Major indices are trending upward following better-than-expected economic indicators.",
        url: "https://example.com/news/1",
        source: "Bloomberg",
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        sentiment: 0.6
      },
      {
        title: "Central Banks Considering Rate Adjustments In Response To Inflation Trends",
        description: "Several major central banks signal potential policy shifts in upcoming meetings.",
        url: "https://example.com/news/2",
        source: "Reuters",
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        sentiment: -0.2
      },
      {
        title: "Tech Sector Leads Market Rally On Strong Earnings Reports",
        description: "Technology companies exceed expectations, driving broader market gains.",
        url: "https://example.com/news/3",
        source: "CNBC",
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        reliability: "medium",
        sentiment: 0.7
      },
      {
        title: "Cryptocurrency Market Sees Renewed Institutional Interest",
        description: "Major financial institutions increase digital asset positions amid regulatory clarity.",
        url: "https://example.com/news/4",
        source: "Financial Times",
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        sentiment: 0.5
      },
      {
        title: "Oil Prices Stabilize Following Supply Disruption Concerns",
        description: "Crude markets find equilibrium after volatile trading sessions driven by geopolitical tensions.",
        url: "https://example.com/news/5",
        source: "Yahoo Finance",
        publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
        reliability: "medium",
        sentiment: 0.1
      }
    ];
    
    return fallbackNews.slice(0, limit);
  }
  
  private getFallbackCurrencyNews(currencyId: string, limit: number): NewsArticle[] {
    const now = new Date();
    const currencyName = this.getCurrencyName(currencyId);
    const currencySymbol = currencyId.toUpperCase();
    
    const fallbackNews: NewsArticle[] = [
      {
        title: `${currencyName} Shows Strong Momentum In Recent Trading`,
        description: `${currencyName} (${currencySymbol}) continues to attract investor attention as price action remains positive.`,
        url: `https://example.com/currency/${currencyId}/1`,
        source: "Bloomberg",
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        sentiment: 0.6
      },
      {
        title: `Analysts Remain Optimistic About ${currencyName} Despite Market Volatility`,
        description: `Several leading market analysts maintain positive outlook for ${currencyName}, citing strong fundamentals.`,
        url: `https://example.com/currency/${currencyId}/2`,
        source: "Reuters",
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        reliability: "high",
        sentiment: 0.4
      },
      {
        title: `${currencySymbol} Trading Volume Increases Significantly Over Past Week`,
        description: `${currencyName} sees growing trading activity, suggesting increased market interest.`,
        url: `https://example.com/currency/${currencyId}/3`,
        source: "CNBC",
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        reliability: "medium",
        sentiment: 0.5
      }
    ];
    
    return fallbackNews.slice(0, limit);
  }
}

export const newsService = new NewsService();
export default newsService;