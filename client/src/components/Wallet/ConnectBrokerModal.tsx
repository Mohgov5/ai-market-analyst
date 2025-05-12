import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { X, ArrowRight, Check, Lock } from 'lucide-react';

interface ConnectBrokerModalProps {
  onClose: () => void;
}

interface BrokerOption {
  id: string;
  name: string;
  logo: string;
  description: string;
  popular: boolean;
}

const ConnectBrokerModal: React.FC<ConnectBrokerModalProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<'select' | 'connect' | 'success'>('select');
  const [selectedBroker, setSelectedBroker] = useState<BrokerOption | null>(null);
  const [loginCredentials, setLoginCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    accountNumber: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Available brokers
  const brokerOptions: BrokerOption[] = [
    {
      id: 'binance',
      name: 'Binance',
      logo: 'https://crypto-logos.s3.amazonaws.com/binance.png',
      description: 'Leading global cryptocurrency exchange with the highest trading volume',
      popular: true
    },
    {
      id: 'fxcm',
      name: 'FXCM',
      logo: 'https://forex-logos.s3.amazonaws.com/fxcm.png',
      description: 'Global forex and CFD broker providing access to worldwide financial markets',
      popular: true
    },
    {
      id: 'mexem',
      name: 'MexeM',
      logo: 'https://broker-logos.s3.amazonaws.com/mexem.png',
      description: 'Multi-asset broker offering global market access with competitive pricing',
      popular: false
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      logo: 'https://crypto-logos.s3.amazonaws.com/coinbase.png',
      description: 'User-friendly cryptocurrency exchange with a wide range of supported assets',
      popular: true
    },
    {
      id: 'interactive-brokers',
      name: 'Interactive Brokers',
      logo: 'https://broker-logos.s3.amazonaws.com/ib.png',
      description: 'Professional trading platform with access to stocks, options, futures, currencies and bonds',
      popular: true
    },
    {
      id: 'kraken',
      name: 'Kraken',
      logo: 'https://crypto-logos.s3.amazonaws.com/kraken.png',
      description: 'Secure cryptocurrency exchange with advanced features for experienced traders',
      popular: false
    }
  ];

  const handleSelectBroker = (broker: BrokerOption) => {
    setSelectedBroker(broker);
    setStep('connect');
  };
  
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBroker) return;
    
    setLoading(true);
    
    // In a real app, this would call your backend API to establish the connection
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Move to success step
      setStep('success');
    } catch (error) {
      console.error('Error connecting broker:', error);
      // Handle error (show error message, etc.)
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Get fields required for the selected broker
  const getRequiredFields = () => {
    if (!selectedBroker) return [];
    
    switch (selectedBroker.id) {
      case 'binance':
      case 'coinbase':
      case 'kraken':
        return ['apiKey', 'apiSecret'];
      case 'fxcm':
      case 'mexem':
      case 'interactive-brokers':
        return ['accountNumber', 'apiKey', 'passphrase'];
      default:
        return ['apiKey', 'apiSecret'];
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`max-w-xl w-full rounded-lg shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold">
            {step === 'select' ? 'Connect Broker' : 
             step === 'connect' ? `Connect to ${selectedBroker?.name}` :
             'Connection Successful'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 focus:outline-none">
            <X size={20} />
          </button>
        </div>
        
        {/* Select Broker Step */}
        {step === 'select' && (
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-4">
              Connect your broker account to AI Market Analyst to synchronize your positions, execute trades, and analyze performance.
            </p>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Popular Brokers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brokerOptions.filter(broker => broker.popular).map(broker => (
                  <div 
                    key={broker.id}
                    onClick={() => handleSelectBroker(broker)}
                    className={`p-3 rounded-lg cursor-pointer border ${theme === 'dark' ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'} transition flex items-center justify-between`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {broker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{broker.name}</p>
                        <p className="text-xs text-gray-400">Trading & Analytics</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Other Brokers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brokerOptions.filter(broker => !broker.popular).map(broker => (
                  <div 
                    key={broker.id}
                    onClick={() => handleSelectBroker(broker)}
                    className={`p-3 rounded-lg cursor-pointer border ${theme === 'dark' ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'} transition flex items-center justify-between`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {broker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{broker.name}</p>
                        <p className="text-xs text-gray-400">Trading & Analytics</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mt-6 mb-2">
              <p>Don't see your broker? <a href="#" className="text-primary-500 hover:underline">Request integration</a></p>
            </div>
          </div>
        )}
        
        {/* Connect Broker Step */}
        {step === 'connect' && selectedBroker && (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full mr-3 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {selectedBroker.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedBroker.name}</p>
                <p className="text-xs text-gray-400">{selectedBroker.description}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-start">
                <Lock size={16} className="mt-1 mr-2 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Secure Connection</p>
                  <p className="text-xs text-gray-400">
                    Your API credentials are encrypted and never stored in plaintext. We use read-only API access when possible for security.
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleConnect}>
              {getRequiredFields().includes('accountNumber') && (
                <div className="mb-4">
                  <label htmlFor="accountNumber" className="block text-sm font-medium mb-1">
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    value={loginCredentials.accountNumber}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Your broker account number"
                  />
                </div>
              )}
              
              {getRequiredFields().includes('apiKey') && (
                <div className="mb-4">
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    name="apiKey"
                    type="text"
                    value={loginCredentials.apiKey}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Your API key from broker dashboard"
                  />
                </div>
              )}
              
              {getRequiredFields().includes('apiSecret') && (
                <div className="mb-4">
                  <label htmlFor="apiSecret" className="block text-sm font-medium mb-1">
                    API Secret
                  </label>
                  <input
                    id="apiSecret"
                    name="apiSecret"
                    type="password"
                    value={loginCredentials.apiSecret}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Your API secret"
                  />
                </div>
              )}
              
              {getRequiredFields().includes('passphrase') && (
                <div className="mb-4">
                  <label htmlFor="passphrase" className="block text-sm font-medium mb-1">
                    API Passphrase
                  </label>
                  <input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    value={loginCredentials.passphrase}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Your API passphrase"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className={`px-4 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md text-sm bg-primary-500 hover:bg-primary-600 text-white transition flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">Connecting</span>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </>
                  ) : (
                    'Connect Account'
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-xs text-gray-400 mt-6">
              <p>
                By connecting your account, you agree to our <a href="#" className="text-primary-500 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        )}
        
        {/* Success Step */}
        {step === 'success' && selectedBroker && (
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white mb-4">
                <Check size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2">{selectedBroker.name} Connected!</h4>
              <p className="text-sm text-gray-400 text-center mb-6">
                Your account has been successfully connected. Your balances and positions will be synchronized shortly.
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
                >
                  Close
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2 rounded-md text-sm bg-primary-500 hover:bg-primary-600 text-white transition"
                >
                  Connect Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectBrokerModal;