import React, { useState, useEffect } from 'react';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Wallet as WalletIcon, 
  Plus, 
  CreditCard, 
  DollarSign, 
  ExternalLink, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  MoreHorizontal, 
  Briefcase,
  BarChart2,
  Layers
} from 'lucide-react';
import ConnectBrokerModal from '../components/Wallet/ConnectBrokerModal';
import AddFundsModal from '../components/Wallet/AddFundsModal';
import WithdrawFundsModal from '../components/Wallet/WithdrawFundsModal';
import AssetAllocation from '../components/Wallet/AssetAllocation';
import PortfolioValue from '../components/Wallet/PortfolioValue';
import TransactionHistory from '../components/Wallet/TransactionHistory';

// Types
interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  balance: number;
  currency: string;
  connected: boolean;
  lastUpdated: string;
}

interface Position {
  id: string;
  symbol: string;
  type: 'crypto' | 'forex' | 'stock';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  openDate: string;
}

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

const Wallet: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'transactions'>('overview');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user's wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      try {
        // In a real app, these would be API calls to your backend
        // For now, we'll simulate with mock data
        
        // Fetch broker accounts
        const mockBrokerAccounts: BrokerAccount[] = [
          {
            id: 'binance-1',
            name: 'Binance Main',
            broker: 'Binance',
            balance: 12548.92,
            currency: 'USD',
            connected: true,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'fxcm-1',
            name: 'FXCM Trading',
            broker: 'FXCM',
            balance: 5280.15,
            currency: 'USD',
            connected: true,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'mexem-1',
            name: 'MexeM Account',
            broker: 'MexeM',
            balance: 0,
            currency: 'USD',
            connected: false,
            lastUpdated: '-'
          }
        ];
        
        // Fetch positions
        const mockPositions: Position[] = [
          {
            id: 'pos-1',
            symbol: 'BTC/USD',
            type: 'crypto',
            quantity: 0.25,
            entryPrice: 42156.78,
            currentPrice: 43250.45,
            pnl: 273.42,
            pnlPercentage: 2.59,
            openDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'pos-2',
            symbol: 'ETH/USD',
            type: 'crypto',
            quantity: 2.5,
            entryPrice: 2215.30,
            currentPrice: 2187.65,
            pnl: -69.12,
            pnlPercentage: -1.25,
            openDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'pos-3',
            symbol: 'EUR/USD',
            type: 'forex',
            quantity: 10000,
            entryPrice: 1.0825,
            currentPrice: 1.0876,
            pnl: 51.00,
            pnlPercentage: 0.47,
            openDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        // Fetch transactions
        const mockTransactions: Transaction[] = [
          {
            id: 'tx-1',
            type: 'buy',
            symbol: 'BTC/USD',
            amount: 0.25,
            price: 42156.78,
            total: 10539.20,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            broker: 'Binance'
          },
          {
            id: 'tx-2',
            type: 'deposit',
            amount: 5000,
            total: 5000,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            broker: 'FXCM'
          },
          {
            id: 'tx-3',
            type: 'buy',
            symbol: 'ETH/USD',
            amount: 2.5,
            price: 2215.30,
            total: 5538.25,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            broker: 'Binance'
          },
          {
            id: 'tx-4',
            type: 'buy',
            symbol: 'EUR/USD',
            amount: 10000,
            price: 1.0825,
            total: 10825.00,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            broker: 'FXCM'
          },
          {
            id: 'tx-5',
            type: 'deposit',
            amount: 10000,
            total: 10000,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            broker: 'Binance'
          }
        ];
        
        setBrokerAccounts(mockBrokerAccounts);
        setPositions(mockPositions);
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);
  
  // Calculate total balance across all connected accounts
  const totalBalance = brokerAccounts
    .filter(account => account.connected)
    .reduce((total, account) => total + account.balance, 0);
  
  // Calculate total unrealized P&L
  const totalPnL = positions.reduce((total, position) => total + position.pnl, 0);
  const totalPnLPercentage = (totalPnL / totalBalance) * 100;
  
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start mb-6 w-full">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <WalletIcon className="mr-2 text-primary-500" size={24} />
            My Wallet
          </h2>
          <p className="text-gray-400 mt-1">Manage your accounts, positions, and transactions</p>
        </div>
        
        <div className="flex space-x-2 mt-4 lg:mt-0">
          <button 
            onClick={() => setShowAddFundsModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Funds
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center`}
          >
            <CreditCard size={16} className="mr-1" />
            Withdraw
          </button>
          <button 
            onClick={() => setShowConnectModal(true)}
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center`}
          >
            <ExternalLink size={16} className="mr-1" />
            Connect Broker
          </button>
        </div>
      </div>
      
      {/* Portfolio Summary */}
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6 w-full`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">Portfolio Summary</h3>
            <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleString()}</p>
          </div>
          <div className="mt-3 lg:mt-0">
            <div className="flex items-center justify-end">
              <p className="text-xl font-bold mr-2">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className={`flex items-center ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? <ArrowUp size={16} className="mr-1" /> : <ArrowDown size={16} className="mr-1" />}
                <span>
                  ${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                  ({Math.abs(totalPnLPercentage).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <PortfolioValue />
          </div>
          <div>
            <AssetAllocation />
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="border-b mb-6 flex w-full">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm border-b-2 ${activeTab === 'overview' 
            ? 'border-primary-500 text-primary-500' 
            : 'border-transparent hover:text-primary-400'}`}
        >
          <Briefcase size={16} className="inline mr-1" />
          Accounts Overview
        </button>
        <button 
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 text-sm border-b-2 ${activeTab === 'positions' 
            ? 'border-primary-500 text-primary-500' 
            : 'border-transparent hover:text-primary-400'}`}
        >
          <BarChart2 size={16} className="inline mr-1" />
          Open Positions
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm border-b-2 ${activeTab === 'transactions' 
            ? 'border-primary-500 text-primary-500' 
            : 'border-transparent hover:text-primary-400'}`}
        >
          <Layers size={16} className="inline mr-1" />
          Transaction History
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="w-full">
        {/* Accounts Overview */}
        {activeTab === 'overview' && (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Connected Accounts</h3>
              <button 
                onClick={() => setShowConnectModal(true)}
                className="text-primary-500 text-sm hover:underline flex items-center"
              >
                <Plus size={14} className="mr-1" />
                Add Account
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Broker</th>
                    <th className="text-left p-3 text-sm font-semibold">Account Name</th>
                    <th className="text-right p-3 text-sm font-semibold">Balance</th>
                    <th className="text-center p-3 text-sm font-semibold">Status</th>
                    <th className="text-right p-3 text-sm font-semibold">Last Updated</th>
                    <th className="text-right p-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerAccounts.map((account) => (
                    <tr 
                      key={account.id}
                      className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-primary-500 text-white`}>
                            {account.broker.charAt(0)}
                          </div>
                          <span>{account.broker}</span>
                        </div>
                      </td>
                      <td className="p-3">{account.name}</td>
                      <td className="p-3 text-right font-medium">
                        {account.connected ? (
                          `${account.currency} ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {account.connected ? (
                          <span className="px-2 py-1 bg-green-500 bg-opacity-10 text-green-500 rounded-full text-xs">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-500 bg-opacity-10 text-amber-500 rounded-full text-xs">
                            Not Connected
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-sm">
                        {account.connected ? new Date(account.lastUpdated).toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button className="p-1 hover:bg-gray-200 hover:bg-opacity-20 rounded">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {brokerAccounts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You haven't connected any brokers yet.</p>
                <button 
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                >
                  Connect Your First Broker
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Open Positions */}
        {activeTab === 'positions' && (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Open Positions</h3>
              <div className="text-sm text-gray-400">
                Total P&L: 
                <span className={`ml-2 font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Symbol</th>
                    <th className="text-left p-3 text-sm font-semibold">Type</th>
                    <th className="text-right p-3 text-sm font-semibold">Quantity</th>
                    <th className="text-right p-3 text-sm font-semibold">Entry Price</th>
                    <th className="text-right p-3 text-sm font-semibold">Current Price</th>
                    <th className="text-right p-3 text-sm font-semibold">P&L</th>
                    <th className="text-right p-3 text-sm font-semibold">Open Date</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr 
                      key={position.id}
                      className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <td className="p-3 font-medium">{position.symbol}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          position.type === 'crypto' ? 'bg-purple-500 bg-opacity-10 text-purple-500' :
                          position.type === 'forex' ? 'bg-blue-500 bg-opacity-10 text-blue-500' :
                          'bg-green-500 bg-opacity-10 text-green-500'
                        }`}>
                          {position.type.charAt(0).toUpperCase() + position.type.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-right">{position.quantity}</td>
                      <td className="p-3 text-right">${position.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">${position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">
                        <div className={`flex items-center justify-end ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {position.pnl >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                          <span>
                            ${Math.abs(position.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs ml-1">({Math.abs(position.pnlPercentage).toFixed(2)}%)</span>
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-sm">
                        {new Date(position.openDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {positions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't have any open positions.</p>
                <Link 
                  to="/crypto"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg inline-block"
                >
                  Explore Markets
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Transaction History - MODIFIED TO USE THE COMPONENT */}
        {activeTab === 'transactions' && (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg w-full`}>
            <h3 className="text-lg font-bold mb-4">Transaction History</h3>
            <TransactionHistory transactions={transactions} />
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showConnectModal && (
        <ConnectBrokerModal onClose={() => setShowConnectModal(false)} />
      )}
      
      {showAddFundsModal && (
        <AddFundsModal onClose={() => setShowAddFundsModal(false)} brokerAccounts={brokerAccounts} />
      )}
      
      {showWithdrawModal && (
        <WithdrawFundsModal onClose={() => setShowWithdrawModal(false)} brokerAccounts={brokerAccounts} />
      )}
    </div>
  );
};

export default Wallet;