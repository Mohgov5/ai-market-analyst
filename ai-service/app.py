# ai-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import pandas as pd
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
from datetime import datetime
import ta
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load sentiment model
tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
model.eval()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'AI service is running'})

@app.route('/api/v1/sentiment-analysis', methods=['POST'])
def analyze_sentiment():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text']
    
    try:
        # Tokenize input
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        # Get model prediction
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get sentiment scores
        probabilities = F.softmax(outputs.logits, dim=-1)
        
        # FinBERT classes: [negative, neutral, positive]
        sentiment_score = probabilities[0][2].item() - probabilities[0][0].item()  # positive - negative
        
        # Determine sentiment label
        if sentiment_score > 0.6:
            sentiment_label = "very_bullish"
        elif sentiment_score > 0.2:
            sentiment_label = "bullish"
        elif sentiment_score >= -0.2:
            sentiment_label = "neutral"
        elif sentiment_score >= -0.6:
            sentiment_label = "bearish"
        else:
            sentiment_label = "very_bearish"
        
        return jsonify({
            'sentiment_score': sentiment_score,
            'sentiment_label': sentiment_label,
            'raw_scores': {
                'negative': probabilities[0][0].item(),
                'neutral': probabilities[0][1].item(),
                'positive': probabilities[0][2].item()
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/technical-analysis', methods=['POST'])
def analyze_technical():
    data = request.json
    if not data or 'prices' not in data:
        return jsonify({'error': 'No price data provided'}), 400
    
    try:
        # Convert input to DataFrame
        prices = pd.DataFrame(data['prices'])
        
        # Make sure we have the required columns
        required_columns = ['timestamp', 'close']
        if not all(col in prices.columns for col in required_columns):
            return jsonify({'error': 'Price data must include timestamp and close columns'}), 400
        
        # Convert timestamp to datetime and set as index
        prices['timestamp'] = pd.to_datetime(prices['timestamp'])
        prices.set_index('timestamp', inplace=True)
        prices.sort_index(inplace=True)
        
        # Calculate technical indicators
        # RSI
        prices['rsi'] = ta.momentum.RSIIndicator(prices['close']).rsi()
        
        # MACD
        macd = ta.trend.MACD(prices['close'])
        prices['macd'] = macd.macd()
        prices['macd_signal'] = macd.macd_signal()
        prices['macd_hist'] = macd.macd_diff()
        
        # Bollinger Bands
        bollinger = ta.volatility.BollingerBands(prices['close'])
        prices['bollinger_high'] = bollinger.bollinger_hband()
        prices['bollinger_low'] = bollinger.bollinger_lband()
        prices['bollinger_mid'] = bollinger.bollinger_mavg()
        
        # Moving Averages
        prices['sma20'] = ta.trend.SMAIndicator(prices['close'], window=20).sma_indicator()
        prices['sma50'] = ta.trend.SMAIndicator(prices['close'], window=50).sma_indicator()
        prices['sma200'] = ta.trend.SMAIndicator(prices['close'], window=200).sma_indicator()
        prices['ema20'] = ta.trend.EMAIndicator(prices['close'], window=20).ema_indicator()
        prices['ema50'] = ta.trend.EMAIndicator(prices['close'], window=50).ema_indicator()
        prices['ema200'] = ta.trend.EMAIndicator(prices['close'], window=200).ema_indicator()
        
        # Get the latest values for analysis
        latest = prices.iloc[-1]
        
        # Determine trend based on EMAs
        trend_ema = "neutral"
        if latest['ema20'] > latest['ema50'] and latest['ema50'] > latest['ema200']:
            trend_ema = "strong_bullish"
        elif latest['ema20'] > latest['ema50']:
            trend_ema = "bullish"
        elif latest['ema20'] < latest['ema50'] and latest['ema50'] < latest['ema200']:
            trend_ema = "strong_bearish"
        elif latest['ema20'] < latest['ema50']:
            trend_ema = "bearish"
        
        # Determine trend based on RSI
        trend_rsi = "neutral"
        if latest['rsi'] > 70:
            trend_rsi = "overbought"
        elif latest['rsi'] < 30:
            trend_rsi = "oversold"
        elif latest['rsi'] > 60:
            trend_rsi = "bullish"
        elif latest['rsi'] < 40:
            trend_rsi = "bearish"
        
        # Determine MACD trend
        trend_macd = "neutral"
        if latest['macd'] > latest['macd_signal'] and latest['macd_hist'] > 0:
            trend_macd = "bullish"
        elif latest['macd'] < latest['macd_signal'] and latest['macd_hist'] < 0:
            trend_macd = "bearish"
        
        # Overall trend (simple average)
        trends = {"strong_bullish": 2, "bullish": 1, "neutral": 0, "bearish": -1, "strong_bearish": -2,
                 "overbought": 0.5, "oversold": -0.5}
        
        trend_score = (trends.get(trend_ema, 0) + trends.get(trend_rsi, 0) + trends.get(trend_macd, 0)) / 3
        
        if trend_score > 1.5:
            overall_trend = "strong_bullish"
        elif trend_score > 0.5:
            overall_trend = "bullish"
        elif trend_score > -0.5:
            overall_trend = "neutral"
        elif trend_score > -1.5:
            overall_trend = "bearish"
        else:
            overall_trend = "strong_bearish"
        
        # Generate recommendation
        if overall_trend == "strong_bullish":
            recommendation = "strong_buy"
        elif overall_trend == "bullish":
            recommendation = "buy"
        elif overall_trend == "neutral":
            recommendation = "hold"
        elif overall_trend == "bearish":
            recommendation = "sell"
        else:
            recommendation = "strong_sell"
        
        # Calculate support and resistance levels (simple method)
        prices_window = prices.tail(30)  # Last 30 data points
        price_min = prices_window['close'].min()
        price_max = prices_window['close'].max()
        current_price = latest['close']
        
        # Simple support/resistance bands (can be improved with more sophisticated methods)
        price_range = price_max - price_min
        support_levels = [
            price_min,
            current_price - (price_range * 0.05),
            current_price - (price_range * 0.1)
        ]
        resistance_levels = [
            current_price + (price_range * 0.05),
            current_price + (price_range * 0.1),
            price_max
        ]
        
        # Confidence level - simplified
        confidence = 0.7  # Base confidence
        
        # Higher confidence with stronger trends
        if overall_trend in ["strong_bullish", "strong_bearish"]:
            confidence = 0.85
        
        # Lower confidence with conflicting signals
        if trend_ema != trend_macd or trend_ema != trend_rsi:
            confidence -= 0.1
        
        # Final result
        result = {
            'trend': overall_trend,
            'recommendation': recommendation,
            'confidence': confidence,
            'indicators': {
                'rsi': float(latest['rsi']),
                'macd': {
                    'macd': float(latest['macd']),
                    'signal': float(latest['macd_signal']),
                    'histogram': float(latest['macd_hist'])
                },
                'moving_averages': {
                    'sma20': float(latest['sma20']),
                    'sma50': float(latest['sma50']),
                    'sma200': float(latest['sma200']),
                    'ema20': float(latest['ema20']),
                    'ema50': float(latest['ema50']),
                    'ema200': float(latest['ema200'])
                },
                'bollinger_bands': {
                    'upper': float(latest['bollinger_high']),
                    'middle': float(latest['bollinger_mid']),
                    'lower': float(latest['bollinger_low'])
                }
            },
            'support_levels': support_levels,
            'resistance_levels': resistance_levels,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/combined-analysis', methods=['POST'])
def combined_analysis():
    data = request.json
    if not data or 'prices' not in data or 'news' not in data:
        return jsonify({'error': 'Missing required data'}), 400
    
    try:
        # Get technical analysis
        tech_result = analyze_technical().get_json()
        
        # Analyze sentiment for each news item
        news_sentiments = []
        overall_sentiment = 0
        
        for article in data['news']:
            # Use the text of the article (or title if no content)
            text = article.get('content', article.get('description', article.get('title', '')))
            if not text:
                continue
            
            # Get sentiment for this article
            sentiment_data = {'text': text}
            sentiment_result = analyze_sentiment().get_json()
            
            # Store the result
            news_sentiments.append({
                'title': article.get('title', ''),
                'source': article.get('source', ''),
                'url': article.get('url', ''),
                'sentiment_score': sentiment_result['sentiment_score'],
                'sentiment_label': sentiment_result['sentiment_label']
            })
            
            # Weight by source reliability
            reliability_weight = 1.0
            if article.get('reliability') == 'high':
                reliability_weight = 1.0
            elif article.get('reliability') == 'medium':
                reliability_weight = 0.8
            else:
                reliability_weight = 0.6
            
            overall_sentiment += sentiment_result['sentiment_score'] * reliability_weight
        
        # Calculate average sentiment
        if news_sentiments:
            overall_sentiment /= len(news_sentiments)
            
        # Combine technical and sentiment analyses
        technical_weight = 0.7  # 70% weight on technical analysis
        sentiment_weight = 0.3  # 30% weight on sentiment analysis
        
        # Map trend to numeric score
        trend_map = {
            'strong_bullish': 1.0,
            'bullish': 0.5,
            'neutral': 0.0,
            'bearish': -0.5,
            'strong_bearish': -1.0
        }
        
        technical_score = trend_map.get(tech_result['trend'], 0.0)

        # Combine the scores with weights
        combined_score = (technical_score * technical_weight) + (overall_sentiment * sentiment_weight)
        
        # Determine combined recommendation
        if combined_score > 0.7:
            recommendation = "strong_buy"
        elif combined_score > 0.3:
            recommendation = "buy"
        elif combined_score > -0.3:
            recommendation = "hold"
        elif combined_score > -0.7:
            recommendation = "sell"
        else:
            recommendation = "strong_sell"
        
        # Calculate confidence level
        # Higher confidence when technical and sentiment align
        confidence_base = 0.7
        if (technical_score > 0 and overall_sentiment > 0) or (technical_score < 0 and overall_sentiment < 0):
            confidence = min(confidence_base + 0.1, 0.9)  # Agreement increases confidence
        else:
            confidence = max(confidence_base - 0.1, 0.5)  # Disagreement decreases confidence
        
        # Return combined result
        result = {
            'technical_analysis': tech_result,
            'sentiment_analysis': {
                'overall_score': overall_sentiment,
                'news_sentiments': news_sentiments
            },
            'combined_analysis': {
                'score': combined_score,
                'recommendation': recommendation,
                'confidence': confidence,
                'technical_contribution': technical_score * technical_weight,
                'sentiment_contribution': overall_sentiment * sentiment_weight
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        message = data['message']
        conversation_history = data.get('conversation_history', [])
        
        # For a real implementation, you would integrate with an LLM like OpenAI or build your own
        # Here we'll use a simplified rule-based approach for demo purposes
        
        # Extract keywords from the message
        message_lower = message.lower()
        
        response = ""
        related_data = {}
        
        # Check for cryptocurrency related questions
        currencies = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada']
        currency_mentioned = None
        
        for currency in currencies:
            if currency in message_lower:
                currency_mentioned = currency
                break
        
        # Check for technical analysis questions
        technical_terms = ['rsi', 'macd', 'bollinger', 'moving average', 'support', 'resistance', 'trend']
        technical_mentioned = any(term in message_lower for term in technical_terms)
        
        # Questions about sentiment
        sentiment_terms = ['sentiment', 'news', 'media', 'bullish', 'bearish', 'feeling']
        sentiment_mentioned = any(term in message_lower for term in sentiment_terms)
        
        # Questions about prediction or recommendation
        prediction_terms = ['predict', 'recommendation', 'should i buy', 'should i sell', 'good investment']
        prediction_mentioned = any(term in message_lower for term in prediction_terms)
        
        # Generate response based on detected intent
        if currency_mentioned and technical_mentioned:
            response = f"Based on the technical analysis for {currency_mentioned.upper()}, the recent indicators show..."
            
            # In a real implementation, you would fetch actual technical data here
            response += " The RSI is currently at 58, indicating moderate bullish momentum but not yet overbought. "
            response += "The MACD line has crossed above the signal line, suggesting positive momentum. "
            response += "The price is trading above the 50-day moving average, which is a bullish sign."
            
            related_data = {
                'currencies': [currency_mentioned],
                'indicators': ['rsi', 'macd', 'moving_average']
            }
            
        elif currency_mentioned and sentiment_mentioned:
            response = f"The current market sentiment for {currency_mentioned.upper()} is generally positive. "
            response += "Recent news articles from major financial sources indicate growing institutional interest. "
            response += "Social media sentiment analysis shows a moderately bullish trend over the past 24 hours."
            
            related_data = {
                'currencies': [currency_mentioned],
                'indicators': ['sentiment']
            }
            
        elif currency_mentioned and prediction_mentioned:
            response = f"Regarding {currency_mentioned.upper()}, the combined analysis of technical indicators and market sentiment "
            response += "suggests a cautiously optimistic outlook. The current recommendation would be 'Hold', with potential "
            response += "for upside if the price breaks through the nearest resistance level. As always, this is not financial advice "
            response += "and you should consider your own risk tolerance and investment goals."
            
            related_data = {
                'currencies': [currency_mentioned],
                'indicators': ['recommendation']
            }
            
        elif technical_mentioned:
            # Explain a technical indicator
            for term in technical_terms:
                if term in message_lower:
                    if term == 'rsi':
                        response = "The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. "
                        response += "RSI oscillates between 0 and 100. Traditionally, RSI is considered overbought when above 70 and oversold when below 30. "
                        response += "Signals can also be generated by looking for divergences, failure swings, and centerline crossovers."
                    elif term == 'macd':
                        response = "The Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship "
                        response += "between two moving averages of a security's price. The MACD is calculated by subtracting the 26-period Exponential Moving "
                        response += "Average (EMA) from the 12-period EMA. A 9-day EMA of the MACD, called the 'signal line', is then plotted on top of the MACD, "
                        response += "which can function as a trigger for buy and sell signals."
                    else:
                        response = f"The {term} is an important technical analysis tool used by traders to identify market trends and potential entry or exit points."
                    
                    related_data = {
                        'indicators': [term]
                    }
                    break
        else:
            response = "I'm your AI Market Assistant. I can help you analyze cryptocurrencies and financial markets. "
            response += "You can ask me about technical analysis, market sentiment, or specific currencies like Bitcoin or Ethereum. "
            response += "I can also provide educational information about trading concepts and indicators."
        
        return jsonify({
            'message': response,
            'related_data': related_data,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')