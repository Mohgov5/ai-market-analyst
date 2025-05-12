// src/pages/CryptocurrencyList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { useTheme } from '../Context/ThemeContext';
import { currencyService } from '../services/currency.service';

const CryptocurrencyList: React.FC = () => {
  const { theme } = useTheme();
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const data = await currencyService.getCryptocurrencies();
        setCryptos(data);
      } catch (error) {
        console.error('Failed to fetch cryptocurrencies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCryptos();
  }, []);
  
  // Filtrer les cryptos en fonction de la recherche
  const filteredCryptos = cryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Trier les cryptos
  const sortedCryptos = [...filteredCryptos].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });
  
  // Formater le prix
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Fonction pour changer le tri
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cryptocurrencies</h2>
        <div className={`flex items-center rounded-full px-3 py-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <Search size={16} className="mr-2 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cryptocurrencies..."
            className={`bg-transparent border-none focus:outline-none text-sm w-44 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th 
                    className="text-left p-3 text-sm font-semibold cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 text-sm font-semibold cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 text-sm font-semibold cursor-pointer"
                    onClick={() => handleSort('change24h')}
                  >
                    24h Change {sortBy === 'change24h' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 text-sm font-semibold cursor-pointer"
                    onClick={() => handleSort('volume24h')}
                  >
                    Volume {sortBy === 'volume24h' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 text-sm font-semibold cursor-pointer"
                    onClick={() => handleSort('marketCap')}
                  >
                    Market Cap {sortBy === 'marketCap' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCryptos.map((crypto) => (
                  <tr 
                    key={crypto.id}
                    className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <td className="p-3">
                      <Link to={`/crypto/${crypto.id}`} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${
                          crypto.symbol === 'BTC' ? 'bg-orange-500' : 
                          crypto.symbol === 'ETH' ? 'bg-purple-500' : 
                          crypto.symbol === 'SOL' ? 'bg-green-500' :
                          'bg-cyan-500'
                        }`}>
                          {crypto.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{crypto.name}</p>
                          <p className="text-xs text-gray-400">{crypto.symbol}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-right font-medium">${formatPrice(crypto.price)}</td>
                    <td className={`p-3 text-right font-medium ${crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <div className="flex items-center justify-end">
                        {crypto.change24h >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                        {Math.abs(crypto.change24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm">${crypto.volume24h.toLocaleString()}</td>
                    <td className="p-3 text-right text-sm">${crypto.marketCap.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptocurrencyList;