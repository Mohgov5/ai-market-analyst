// src/components/wallet/TransactionHistory.tsx
import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { ArrowUp, ArrowDown, Search, Filter, Download, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal';
  symbol?: string;
  amount: number;
  price?: number;
  total: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  broker: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Search query
    const matchesSearch = 
      (tx.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !tx.symbol) ||
      tx.broker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = transactionType === 'all' || tx.type === transactionType;
    
    // Timeframe filter
    let matchesTimeframe = true;
    const txDate = new Date(tx.date);
    const now = new Date();
    
    if (timeframe === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesTimeframe = txDate >= today;
    } else if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesTimeframe = txDate >= weekAgo;
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesTimeframe = txDate >= monthAgo;
    }
    
    return matchesSearch && matchesType && matchesTimeframe;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'price':
        comparison = (a.price || 0) - (b.price || 0);
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'broker':
        comparison = a.broker.localeCompare(b.broker);
        break;
      default:
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const pageCount = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export transactions as CSV
  const exportCSV = () => {
    const headers = 'Date,Type,Symbol,Amount,Price,Total,Broker,Status\n';
    const csvContent = sortedTransactions.map(tx => {
      return `"${formatDate(tx.date)}","${tx.type}","${tx.symbol || 'N/A'}","${tx.amount}","${tx.price || 'N/A'}","${tx.total}","${tx.broker}","${tx.status}"\n`;
    }).join('');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center rounded-md px-3 py-1.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Search size={16} className="mr-2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className={`bg-transparent border-none focus:outline-none text-sm w-40 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-md flex items-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <Filter size={16} className="mr-1" />
            Filter
          </button>
          
          <button 
            onClick={exportCSV}
            className={`px-3 py-1.5 rounded-md flex items-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <Download size={16} className="mr-1" />
            Export
          </button>
        </div>
        
        <select 
          className={`p-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="buy">Buy Orders</option>
          <option value="sell">Sell Orders</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <div className={`p-3 mb-4 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Time Period</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border text-sm`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border text-sm`}
              >
                <option value="date">Date</option>
                <option value="type">Type</option>
                <option value="amount">Amount</option>
                <option value="total">Total</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className={`w-full px-3 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border text-sm`}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button 
              onClick={() => {
                setTimeframe('all');
                setTransactionType('all');
                setSearchQuery('');
                setSortBy('date');
                setSortOrder('desc');
              }}
              className={`px-3 py-1 text-sm rounded-md mr-2 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Reset
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="px-3 py-1 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-md"
            >
              Apply
            </button>
          </div>
        </div>
      )}
      
      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            <tr>
              <th 
                className="text-left p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {sortBy === 'type' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="text-left p-3 text-sm font-semibold">
                Asset/Symbol
              </th>
              <th 
                className="text-right p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortBy === 'amount' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="text-right p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end">
                  Price
                  {sortBy === 'price' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="text-right p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center justify-end">
                  Total
                  {sortBy === 'total' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="text-left p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('broker')}
              >
                <div className="flex items-center">
                  Broker
                  {sortBy === 'broker' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="text-center p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  Status
                  {sortBy === 'status' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="text-right p-3 text-sm font-semibold cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center justify-end">
                  <Calendar size={14} className="mr-1" />
                  Date
                  {sortBy === 'date' && (
                    sortOrder === 'asc' 
                      ? <ArrowUp size={14} className="ml-1" /> 
                      : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === 'buy' ? 'bg-green-500 bg-opacity-10 text-green-500' :
                      transaction.type === 'sell' ? 'bg-red-500 bg-opacity-10 text-red-500' :
                      transaction.type === 'deposit' ? 'bg-blue-500 bg-opacity-10 text-blue-500' :
                      'bg-amber-500 bg-opacity-10 text-amber-500'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">{transaction.symbol || 'USD'}</td>
                  <td className="p-3 text-right">
                    {transaction.type === 'buy' || transaction.type === 'sell' 
                      ? transaction.amount 
                      : `$${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </td>
                  <td className="p-3 text-right">
                    {transaction.price 
                      ? `$${transaction.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : '-'
                    }
                  </td>
                  <td className="p-3 text-right font-medium">
                    ${transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">{transaction.broker}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === 'completed' ? 'bg-green-500 bg-opacity-10 text-green-500' :
                      transaction.status === 'pending' ? 'bg-amber-500 bg-opacity-10 text-amber-500' :
                      'bg-red-500 bg-opacity-10 text-red-500'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 text-right text-sm">
                    {formatDate(transaction.date)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <p className="text-gray-400">No transactions found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === 1 
                ? `${theme === 'dark' ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed` 
                : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
            }`}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {pageCount}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
            disabled={currentPage === pageCount}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === pageCount 
                ? `${theme === 'dark' ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed` 
                : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;