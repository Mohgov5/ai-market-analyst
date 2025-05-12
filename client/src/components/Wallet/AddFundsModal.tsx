import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { X, CreditCard, DollarSign, Check, Lock, AlertCircle } from 'lucide-react';

interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  balance: number;
  currency: string;
  connected: boolean;
  lastUpdated: string;
}

interface AddFundsModalProps {
  onClose: () => void;
  brokerAccounts: BrokerAccount[];
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, brokerAccounts }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const connectedAccounts = brokerAccounts.filter(account => account.connected);
  
  const [formData, setFormData] = useState({
    account: connectedAccounts.length > 0 ? connectedAccounts[0].id : '',
    amount: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user makes changes
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.account) {
      setErrorMessage('Please select an account');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
        setErrorMessage('Please fill in all card details');
        return;
      }
      
      // Basic card number validation
      if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
        setErrorMessage('Please enter a valid 16-digit card number');
        return;
      }
    }
    
    // Start processing
    setStep('processing');
    
    // Simulate API call to process deposit
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Move to success step
      setStep('success');
    } catch (error) {
      console.error('Error processing deposit:', error);
      setErrorMessage('Failed to process deposit. Please try again.');
      setStep('form');
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (input: string) => {
    const value = input.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    return formatted;
  };
  
  // Format expiry date (MM/YY)
  const formatExpiryDate = (input: string) => {
    const value = input.replace(/\D/g, '');
    if (value.length <= 2) return value;
    return `${value.slice(0, 2)}/${value.slice(2, 4)}`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`max-w-md w-full rounded-lg shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold">
            {step === 'form' ? 'Add Funds' : 
             step === 'processing' ? 'Processing Deposit' :
             'Deposit Successful'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 focus:outline-none">
            <X size={20} />
          </button>
        </div>
        
        {/* Form Step */}
        {step === 'form' && (
          <div className="p-4">
            {errorMessage && (
              <div className={`p-3 mb-4 rounded-lg flex items-center ${theme === 'dark' ? 'bg-red-900 bg-opacity-20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="account" className="block text-sm font-medium mb-1">
                  Select Account
                </label>
                {connectedAccounts.length > 0 ? (
                  <select
                    id="account"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    {connectedAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.broker})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-sm text-gray-400">
                      No connected accounts available. Please connect a broker account first.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="amount"
                    name="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    className={`w-full pl-10 px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                <div className="flex space-x-2">
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer ${formData.paymentMethod === 'card' ? 'border-primary-500' : `${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <CreditCard size={20} className="mr-2 text-primary-500" />
                    <span>Credit Card</span>
                  </label>
                  
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer ${formData.paymentMethod === 'bank' ? 'border-primary-500' : `${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <DollarSign size={20} className="mr-2 text-primary-500" />
                    <span>Bank Transfer</span>
                  </label>
                </div>
              </div>
              
              {formData.paymentMethod === 'card' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                      Card Number
                    </label>
                    <input
                      id="cardNumber"
                      name="cardNumber"
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      maxLength={19} // 16 digits + 3 spaces
                      required
                      className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
                        Expiry Date
                      </label>
                      <input
                        id="expiryDate"
                        name="expiryDate"
                        type="text"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                        maxLength={5} // MM/YY
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="MM/YY"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                        CVV
                      </label>
                      <input
                        id="cvv"
                        name="cvv"
                        type="password"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        maxLength={4}
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="cardholderName" className="block text-sm font-medium mb-1">
                      Cardholder Name
                    </label>
                    <input
                      id="cardholderName"
                      name="cardholderName"
                      type="text"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}
              
              {formData.paymentMethod === 'bank' && (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                  <h4 className="font-medium mb-2">Bank Transfer Instructions</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Please use the following details to make a bank transfer:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">Account Name:</span> AI Market Analyst Ltd</p>
                    <p><span className="text-gray-400">Account Number:</span> 12345678</p>
                    <p><span className="text-gray-400">Sort Code:</span> 01-23-45</p>
                    <p><span className="text-gray-400">Reference:</span> Your Account ID</p>
                  </div>
                </div>
              )}
              
              <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-start">
                  <Lock size={16} className="mt-1 mr-2 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Secure Transaction</p>
                    <p className="text-xs text-gray-400">
                      All payment information is encrypted and processed securely. We do not store your card details.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.account || !formData.amount}
                  className={`px-4 py-2 rounded-md text-sm ${
                    !formData.account || !formData.amount ?
                    'bg-primary-500 opacity-50 cursor-not-allowed' :
                    'bg-primary-500 hover:bg-primary-600'
                  } text-white transition`}
                >
                  {formData.paymentMethod === 'card' ? 'Deposit Now' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-6"></div>
              <h4 className="text-xl font-bold mb-2">Processing Your Deposit</h4>
              <p className="text-sm text-gray-400 text-center">
                Please wait while we process your transaction. This might take a moment.
              </p>
            </div>
          </div>
        )}
        
        {/* Success Step */}
        {step === 'success' && (
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white mb-4">
                <Check size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2">Deposit Successful!</h4>
              <p className="text-sm text-gray-400 text-center mb-2">
                Your deposit of ${parseFloat(formData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been processed successfully.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-sm bg-primary-500 hover:bg-primary-600 text-white transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFundsModal;