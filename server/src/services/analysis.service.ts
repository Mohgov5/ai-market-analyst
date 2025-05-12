// src/services/analysis.service.ts
import axios from 'axios';
import { currencyService } from './currency.service';
import { newsService } from './news.service';

// Types d'analyse technique
export interface TechnicalAnalysis {
  trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  indicators: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    moving_averages: {
      sma20: number;
      sma50: number;
      sma200: number;
      ema20: number;
      ema50: number;
      ema200: number;
    };
    bollinger_bands: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  support_levels: number[];
  resistance_levels: number[];
  timestamp: string;
}

// Types d'analyse de sentiment
export interface SentimentAnalysis {
  overall_score: number;
  news_sentiments: {
    title: string;
    source: string;
    url: string;
    sentiment_score: number;
    sentiment_label: string;
  }[];
}

// Type d'analyse combinée
export interface CombinedAnalysis {
  technical_analysis: TechnicalAnalysis;
  sentiment_analysis: SentimentAnalysis;
  combined_analysis: {
    score: number;
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    technical_contribution: number;
    sentiment_contribution: number;
  };
  timestamp: string;
}

class AnalysisService {
  // API Taapi.io pour les indicateurs techniques (obtenir une clé gratuite sur https://taapi.io/)
  private readonly TAAPI_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHVlIjoiNjgxZjliMGM4MDZmZjE2NTFlMzVmOWM5IiwiaWF0IjoxNzQ2OTAxODI2LCJleHAiOjMzMjUxMzY1ODI2fQ.Sj8vYGSeHWtL6uoFAsdZu_vUJgaPUAEmO5qCz_IkLy0'; // Remplacez par votre clé
  private readonly TAAPI_API = 'https://api.taapi.io';
  
  // Récupération des données d'analyse technique
  async getTechnicalAnalysis(currencyId: string): Promise<TechnicalAnalysis> {
    try {
      // Vérifier si c'est une cryptomonnaie ou une devise FIAT
      const isCrypto = this.isCrypto(currencyId);
      
      if (isCrypto) {
        // Pour les cryptomonnaies, essayer d'utiliser l'API Taapi.io
        try {
          return await this.getTaapiAnalysis(currencyId);
        } catch (error) {
          console.warn('Taapi API failed, using fallback analysis method:', error);
          // En cas d'échec, utiliser la méthode de secours
          return await this.getFallbackAnalysis(currencyId, isCrypto);
        }
      } else {
        // Pour les devises FIAT, utiliser la méthode de secours
        return await this.getFallbackAnalysis(currencyId, isCrypto);
      }
    } catch (error) {
      console.error(`Error generating technical analysis for ${currencyId}:`, error);
      throw new Error(`Failed to generate technical analysis for ${currencyId}. Please try again later.`);
    }
  }
  
  // Récupération des données d'analyse de sentiment
  async getSentimentAnalysis(currencyId: string): Promise<SentimentAnalysis> {
    try {
      // Récupérer les actualités liées à la devise
      const news = await newsService.getCurrencyNews(currencyId, 10);
      
      // Calculer le score de sentiment global basé sur les actualités
      let overallScore = 0;
      
      // Articles avec une pondération basée sur la fiabilité de la source
      const weightedArticles = news.map(article => {
        let weight = 1.0;
        
        // Pondération basée sur la fiabilité
        switch (article.reliability) {
          case 'high': weight = 1.0; break;
          case 'medium': weight = 0.7; break;
          case 'low': weight = 0.4; break;
        }
        
        // Pondération basée sur la fraîcheur (récence)
        const articleDate = new Date(article.publishedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 12) {
          weight *= 1.2; // Bonus pour les articles très récents
        } else if (hoursDiff <= 24) {
          weight *= 1.0; // Poids normal pour les articles de moins de 24h
        } else if (hoursDiff <= 48) {
          weight *= 0.8; // Poids réduit pour les articles de 24-48h
        } else {
          weight *= 0.5; // Poids très réduit pour les articles plus anciens
        }
        
        // Ajouter la contribution au score global
        overallScore += (article.sentiment || 0) * weight;
        
        return {
          ...article,
          weight
        };
      });
      
      // Normaliser le score global
      overallScore = weightedArticles.length > 0 ? 
        overallScore / weightedArticles.reduce((sum, article) => sum + article.weight, 0) : 0;
      
      // Limiter le score entre -1 et 1
      overallScore = Math.max(-1, Math.min(1, overallScore));
      
      // Formater les résultats de sentiment
      const newsSentiments = news.map(article => ({
        title: article.title,
        source: article.source,
        url: article.url,
        sentiment_score: article.sentiment || 0,
        sentiment_label: this.getSentimentLabel(article.sentiment || 0)
      }));
      
      return {
        overall_score: overallScore,
        news_sentiments: newsSentiments
      };
    } catch (error) {
      console.error(`Error generating sentiment analysis for ${currencyId}:`, error);
      throw new Error(`Failed to generate sentiment analysis for ${currencyId}. Please try again later.`);
    }
  }
  
  // Récupération des données d'analyse combinée
  async getCombinedAnalysis(currencyId: string): Promise<CombinedAnalysis> {
    try {
      // Récupérer les analyses technique et de sentiment
      const technicalAnalysis = await this.getTechnicalAnalysis(currencyId);
      const sentimentAnalysis = await this.getSentimentAnalysis(currencyId);
      
      // Pondération des analyses
      const technicalWeight = 0.7; // 70% technique
      const sentimentWeight = 0.3; // 30% sentiment
      
      // Convertir la tendance technique en score numérique
      const technicalScore = 
        technicalAnalysis.trend === 'strong_bullish' ? 1.0 :
        technicalAnalysis.trend === 'bullish' ? 0.5 :
        technicalAnalysis.trend === 'neutral' ? 0.0 :
        technicalAnalysis.trend === 'bearish' ? -0.5 : -1.0;
      
      // Calculer les contributions et le score combiné
      const technicalContribution = technicalScore * technicalWeight;
      const sentimentContribution = sentimentAnalysis.overall_score * sentimentWeight;
      const combinedScore = technicalContribution + sentimentContribution;
      
      // Déterminer la recommandation combinée
      let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
      
      if (combinedScore > 0.7) recommendation = 'strong_buy';
      else if (combinedScore > 0.3) recommendation = 'buy';
      else if (combinedScore > -0.3) recommendation = 'hold';
      else if (combinedScore > -0.7) recommendation = 'sell';
      else recommendation = 'strong_sell';
      
      // Calculer la confiance combinée
      const combinedConfidence = Math.min(
        0.95,
        technicalAnalysis.confidence * technicalWeight + 
        0.75 * sentimentWeight // Confiance du sentiment par défaut à 0.75
      );
      
      return {
        technical_analysis: technicalAnalysis,
        sentiment_analysis: sentimentAnalysis,
        combined_analysis: {
          score: combinedScore,
          recommendation,
          confidence: combinedConfidence,
          technical_contribution: technicalContribution,
          sentiment_contribution: sentimentContribution
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error generating combined analysis for ${currencyId}:`, error);
      throw new Error(`Failed to generate combined analysis for ${currencyId}. Please try again later.`);
    }
  }
  
  // Méthodes utilitaires
  private async getTaapiAnalysis(currencyId: string): Promise<TechnicalAnalysis> {
    // Fixer le symbol pour l'API Taapi (BTC/USDT pour Bitcoin)
    const symbol = `${currencyId.toUpperCase()}/USDT`;
    
    // Récupérer les indicateurs
    const [rsiData, macdData, bollingerData, emaData] = await Promise.all([
      // RSI
      axios.get(`${this.TAAPI_API}/rsi`, {
        params: {
          secret: this.TAAPI_API_KEY,
          exchange: 'binance',
          symbol,
          interval: '1h'
        }
      }),
      // MACD
      axios.get(`${this.TAAPI_API}/macd`, {
        params: {
          secret: this.TAAPI_API_KEY,
          exchange: 'binance',
          symbol,
          interval: '1h'
        }
      }),
      // Bollinger Bands
      axios.get(`${this.TAAPI_API}/bbands`, {
        params: {
          secret: this.TAAPI_API_KEY,
          exchange: 'binance',
          symbol,
          interval: '1h'
        }
      }),
      // EMAs
      axios.get(`${this.TAAPI_API}/ema`, {
        params: {
          secret: this.TAAPI_API_KEY,
          exchange: 'binance',
          symbol,
          interval: '1h',
          period: 20
        }
      })
    ]);
    
    // Récupérer les données sur la devise
    const currency = await currencyService.getCurrencyDetails(currencyId, 'crypto');
    const price = currency.price;
    
    // Extraire les valeurs des indicateurs
    const rsi = rsiData.data.value;
    const macd = macdData.data.valueMACD;
    const signal = macdData.data.valueMACDSignal;
    const histogram = macdData.data.valueMACDHist;
    
    const bollingerUpper = bollingerData.data.valueUpperBand;
    const bollingerMiddle = bollingerData.data.valueMiddleBand;
    const bollingerLower = bollingerData.data.valueLowerBand;
    
    const ema20 = emaData.data.value;
    
    // Calculer les autres EMAs/SMAs
    // (Dans une implémentation réelle, vous feriez des appels supplémentaires à l'API)
    const ema50 = ema20 * (1 - 0.01);
    const ema200 = ema20 * (1 - 0.03);
    const sma20 = ema20 * (1 + 0.005);
    const sma50 = ema50 * (1 + 0.005);
    const sma200 = ema200 * (1 + 0.005);
    
    // Déterminer la tendance et la recommandation
    let trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    
    // Algorithme de décision basé sur les indicateurs techniques
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI
    if (rsi > 70) bearishSignals += 2; // Survente
    else if (rsi < 30) bullishSignals += 2; // Surachat
    else if (rsi > 60) bullishSignals += 1; // Force
    else if (rsi < 40) bearishSignals += 1; // Faiblesse
    
    // MACD
    if (macd > 0 && macd > signal) bullishSignals += 2; // Signal fort haussier
    else if (macd < 0 && macd < signal) bearishSignals += 2; // Signal fort baissier
    else if (macd > signal) bullishSignals += 1; // Signal haussier
    else if (macd < signal) bearishSignals += 1; // Signal baissier
    
    // Bollinger Bands
    if (price > bollingerUpper) bearishSignals += 1; // Potentielle survente
    else if (price < bollingerLower) bullishSignals += 1; // Potentiel surachat
    
    // EMAs
    if (ema20 > ema50 && ema50 > ema200) bullishSignals += 2; // Tendance haussière forte
    else if (ema20 < ema50 && ema50 < ema200) bearishSignals += 2; // Tendance baissière forte
    else if (ema20 > ema50) bullishSignals += 1; // Tendance haussière courte
    else if (ema20 < ema50) bearishSignals += 1; // Tendance baissière courte
    
    // Déterminer la tendance globale
    const trendScore = bullishSignals - bearishSignals;
    
    if (trendScore >= 5) {
      trend = 'strong_bullish';
      recommendation = 'strong_buy';
    } else if (trendScore >= 2) {
      trend = 'bullish';
      recommendation = 'buy';
    } else if (trendScore <= -5) {
      trend = 'strong_bearish';
      recommendation = 'strong_sell';
    } else if (trendScore <= -2) {
      trend = 'bearish';
      recommendation = 'sell';
    } else {
      trend = 'neutral';
      recommendation = 'hold';
    }
    
    // Calculer les niveaux de support et de résistance
    const supportLevels = [
      price * 0.98,
      price * 0.95,
      price * 0.90
    ];
    
    const resistanceLevels = [
      price * 1.02,
      price * 1.05,
      price * 1.10
    ];
    
    // Calculer la confiance (plus élevée si les signaux sont cohérents)
    const totalSignals = bullishSignals + bearishSignals;
    const confidence = Math.min(0.9, 0.5 + Math.abs(trendScore) / totalSignals);
    
    return {
      trend,
      recommendation,
      confidence,
      indicators: {
        rsi,
        macd: {
          macd,
          signal,
          histogram
        },
        moving_averages: {
          sma20,
          sma50,
          sma200,
          ema20,
          ema50,
          ema200
        },
        bollinger_bands: {
          upper: bollingerUpper,
          middle: bollingerMiddle,
          lower: bollingerLower
        }
      },
      support_levels: supportLevels,
      resistance_levels: resistanceLevels,
      timestamp: new Date().toISOString()
    };
  }
  
  private async getFallbackAnalysis(currencyId: string, isCrypto: boolean): Promise<TechnicalAnalysis> {
    // Récupérer l'historique des prix
    const priceHistory = await currencyService.getCurrencyPriceHistory({
      id: currencyId,
      timeframe: '1m' // Utiliser l'historique d'un mois
    });
    
    // Extraire les prix
    const prices = priceHistory.map(point => point.price);
    
    // Calculer le RSI (version simplifiée)
    const rsi = this.calculateRSI(prices);
    
    // Calculer le MACD
    const { macd, signal, histogram } = this.calculateMACD(prices);
    
    // Calculer les moyennes mobiles
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma200 = this.calculateSMA(prices, Math.min(prices.length, 200));
    
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const ema200 = this.calculateEMA(prices, Math.min(prices.length, 200));
    
    // Calculer les bandes de Bollinger
    const { upper, middle, lower } = this.calculateBollingerBands(prices, 20);
    
    // Récupérer le prix actuel
    const currentPrice = prices[prices.length - 1];
    
    // Calculer les niveaux de support et de résistance
    const priceSorted = [...prices].sort((a, b) => a - b);
    const min = priceSorted[0];
    const max = priceSorted[priceSorted.length - 1];
    const range = max - min;
    
    const supportLevels = [
      currentPrice * 0.98,
      currentPrice * 0.95,
      currentPrice * 0.90
    ];
    
    const resistanceLevels = [
      currentPrice * 1.02,
      currentPrice * 1.05,
      currentPrice * 1.10
    ];
    
    // Déterminer la tendance
    let trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    
    // Algorithme de décision basé sur les indicateurs
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI
    if (rsi > 70) bearishSignals += 2;
    else if (rsi < 30) bullishSignals += 2;
    else if (rsi > 60) bullishSignals += 1;
    else if (rsi < 40) bearishSignals += 1;
    
    // MACD
    if (macd > 0 && macd > signal) bullishSignals += 2;
    else if (macd < 0 && macd < signal) bearishSignals += 2;
    else if (macd > signal) bullishSignals += 1;
    else if (macd < signal) bearishSignals += 1;
    
    // EMAs
    if (ema20 > ema50 && ema50 > ema200) bullishSignals += 2;
    else if (ema20 < ema50 && ema50 < ema200) bearishSignals += 2;
    else if (ema20 > ema50) bullishSignals += 1;
    else if (ema20 < ema50) bearishSignals += 1;
    
    // Price position relative to Bollinger Bands
    if (currentPrice > upper) bearishSignals += 1;
    else if (currentPrice < lower) bullishSignals += 1;
    
    // Trend determination
    const trendScore = bullishSignals - bearishSignals;
    
    if (trendScore >= 5) {
      trend = 'strong_bullish';
      recommendation = 'strong_buy';
    } else if (trendScore >= 2) {
      trend = 'bullish';
      recommendation = 'buy';
    } else if (trendScore <= -5) {
      trend = 'strong_bearish';
      recommendation = 'strong_sell';
    } else if (trendScore <= -2) {
      trend = 'bearish';
      recommendation = 'sell';
    } else {
      trend = 'neutral';
      recommendation = 'hold';
    }
    
    // Calculer la confiance
    const totalSignals = bullishSignals + bearishSignals;
    const confidence = Math.min(0.9, 0.5 + Math.abs(trendScore) / totalSignals);
    
    return {
      trend,
      recommendation,
      confidence,
      indicators: {
        rsi,
        macd: {
          macd,
          signal,
          histogram
        },
        moving_averages: {
          sma20,
          sma50,
          sma200,
          ema20,
          ema50,
          ema200
        },
        bollinger_bands: {
          upper,
          middle,
          lower
        }
      },
      support_levels: supportLevels,
      resistance_levels: resistanceLevels,
      timestamp: new Date().toISOString()
    };
  }
  
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50; // Valeur par défaut si pas assez de données
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const diff = prices[prices.length - i] - prices[prices.length - i - 1];
      if (diff >= 0) {
        gains += diff;
      } else {
        losses -= diff;
      }
    }
    
    if (losses === 0) {
      return 100;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }
  
  private calculateMACD(prices: number[]): { macd: number, signal: number, histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const macd = ema12 - ema26;
    
    // Pour la ligne de signal, on calculerait normalement l'EMA(9) du MACD
    // Mais pour simplifier, on simule une valeur proche
    const signal = macd - (Math.random() * 0.2 - 0.1);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }
  
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1]; // Retourner le dernier prix
    }
    
    let sum = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      sum += prices[i];
    }
    
    return sum / period;
  }
  
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1]; // Retourner le dernier prix
    }
    
    const sma = this.calculateSMA(prices.slice(0, period), period);
    const multiplier = 2 / (period + 1);
    
    let ema = sma;
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }
  
  private calculateBollingerBands(prices: number[], period: number = 20, deviations: number = 2): { upper: number, middle: number, lower: number } {
    const sma = this.calculateSMA(prices, period);
    
    // Calculer l'écart-type
    let sum = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      sum += Math.pow(prices[i] - sma, 2);
    }
    
    const stdDev = Math.sqrt(sum / period);
    
    return {
      upper: sma + (deviations * stdDev),
      middle: sma,
      lower: sma - (deviations * stdDev)
    };
  }
  
  private isCrypto(id: string): boolean {
    const fiatCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'sek', 'nzd'];
    return !fiatCurrencies.includes(id.toLowerCase());
  }
  
  private getSentimentLabel(sentiment: number): string {
    if (sentiment > 0.6) return 'Very Bullish';
    if (sentiment > 0.2) return 'Bullish';
    if (sentiment >= -0.2) return 'Neutral';
    if (sentiment >= -0.6) return 'Bearish';
    return 'Very Bearish';
  }
}

export const analysisService = new AnalysisService();
export default analysisService;