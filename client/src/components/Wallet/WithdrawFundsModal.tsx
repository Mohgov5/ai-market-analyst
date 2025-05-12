import React, { useState } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { X, Building, CreditCard, Check, AlertCircle, Info } from 'lucide-react';

interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  balance: number;
  currency: string;
  connected: boolean;
  lastUpdated: string;
}

interface WithdrawFundsModalProps {
  onClose: () => void;
  brokerAccounts: BrokerAccount[];
}

const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({ onClose, brokerAccounts }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const connectedAccounts = brokerAccounts.filter(account => account.connected);
  
  const [formData, setFormData] = useState({
    account: connectedAccounts.length > 0 ? connectedAccounts[0].id : '',
    amount: '',
    withdrawalMethod: 'bank',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    cardNumber: '',
    expiryDate: '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user makes changes
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Find selected account
    const selectedAccount = connectedAccounts.find(acc => acc.id === formData.account);
    
    // Check if amount is less than or equal to available balance
    if (selectedAccount && amount > selectedAccount.balance) {
      setErrorMessage('Withdrawal amount exceeds available balance');
      return;
    }
    
    // Validate withdrawal method details
    if (formData.withdrawalMethod === 'bank' && (!formData.bankName || !formData.accountNumber || !formData.routingNumber || !formData.accountHolderName)) {
      setErrorMessage('Please fill in all bank account details');
      return;
    }
    
    if (formData.withdrawalMethod === 'card' && (!formData.cardNumber || !formData.expiryDate || !formData.accountHolderName)) {
      setErrorMessage('Please fill in all card details');
      return;
    }
    
    // Move to confirmation step
    setStep('confirm');
  };
  
  const handleConfirm = async () => {
    // Start processing
    setStep('processing');
    
    // Simulate API call to process withdrawal
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Move to success step
      setStep('success');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setErrorMessage('Failed to process withdrawal. Please try again.');
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
  
  // Get selected account
  const selectedAccount = connectedAccounts.find(acc => acc.id === formData.account);
  
  // Calculate fees (example: 1% fee)
  const withdrawalAmount = parseFloat(formData.amount) || 0;
  const fee = withdrawalAmount * 0.01;
  const totalWithdrawal = withdrawalAmount - fee;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`max-w-md w-full rounded-lg shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold">
            {step === 'form' ? 'Withdraw Funds' : 
             step === 'confirm' ? 'Confirm Withdrawal' :
             step === 'processing' ? 'Processing Withdrawal' :
             'Withdrawal Successful'}
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
                        {account.name} ({account.broker}) - {account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <input
                    id="amount"
                    name="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Enter amount"
                  />
                  {selectedAccount && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      Max: {selectedAccount.currency} {selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Withdrawal Method
                </label>
                <div className="flex space-x-2">
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer ${formData.withdrawalMethod === 'bank' ? 'border-primary-500' : `${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}`}>
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value="bank"
                      checked={formData.withdrawalMethod === 'bank'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Building size={20} className="mr-2 text-primary-500" />
                    <span>Bank Transfer</span>
                  </label>
                  
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer ${formData.withdrawalMethod === 'card' ? 'border-primary-500' : `${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}`}>
                    <input
                      type="radio"
                      name="withdrawalMethod"
                      value="card"
                      checked={formData.withdrawalMethod === 'card'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <CreditCard size={20} className="mr-2 text-primary-500" />
                    <span>Credit Card</span>
                  </label>
                </div>
              </div>
              
              {formData.withdrawalMethod === 'bank' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="bankName" className="block text-sm font-medium mb-1">
                      Bank Name
                    </label>
                    <input
                      id="bankName"
                      name="bankName"
                      type="text"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Enter bank name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium mb-1">
                        Account Number
                      </label>
                      <input
                        id="accountNumber"
                        name="accountNumber"
                        type="text"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="Account number"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="routingNumber" className="block text-sm font-medium mb-1">
                        Routing Number
                      </label>
                      <input
                        id="routingNumber"
                        name="routingNumber"
                        type="text"
                        value={formData.routingNumber}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="Routing number"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="accountHolderName" className="block text-sm font-medium mb-1">
                      Account Holder Name
                    </label>
                    <input
                      id="accountHolderName"
                      name="accountHolderName"
                      type="text"
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Account holder name"
                    />
                  </div>
                </>
              )}
              
              {formData.withdrawalMethod === 'card' && (
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
                      maxLength={19}
                      required
                      className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Card number"
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
                        maxLength={5}
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="MM/YY"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="accountHolderName" className="block text-sm font-medium mb-1">
                        Cardholder Name
                      </label>
                      <input
                        id="accountHolderName"
                        name="accountHolderName"
                        type="text"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="Cardholder name"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-amber-900 bg-opacity-20' : 'bg-amber-50'}`}>
                <div className="flex items-start">
                  <Info size={16} className="mt-1 mr-2 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium">Withdrawal Information</p>
                    <p className="text-xs text-gray-400">
                      Withdrawals typically take 1-3 business days to process. A fee of 1% applies to all withdrawals.
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
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Confirm Step */}
        {step === 'confirm' && (
          <div className="p-4">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <h4 className="font-medium mb-4">Withdrawal Summary</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">From Account</span>
                  <span>{selectedAccount?.name} ({selectedAccount?.broker})</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Withdrawal Amount</span>
                  <span>${withdrawalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fee (1%)</span>
                  <span>${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total to Receive</span>
                    <span>${totalWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-medium mb-2">Withdrawal Method</h4>
              <div className="flex items-center">
                {formData.withdrawalMethod === 'bank' ? (
                  <>
                    <Building size={20} className="mr-2 text-primary-500" />
                    <div>
                      <p className="text-sm">{formData.bankName}</p>
                      <p className="text-xs text-gray-400">
                        Account ending in {formData.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="mr-2 text-primary-500" />
                    <div>
                      <p className="text-sm">Card ending in {formData.cardNumber.slice(-4)}</p>
                      <p className="text-xs text-gray-400">
                        Expires {formData.expiryDate}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setStep('form')}
                className={`px-4 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-md text-sm bg-primary-500 hover:bg-primary-600 text-white transition"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        )}
        
        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-6"></div>
              <h4 className="text-xl font-bold mb-2">Processing Your Withdrawal</h4>
              <p className="text-sm text-gray-400 text-center">
                Please wait while we process your withdrawal request. This might take a moment.
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
              <h4 className="text-xl font-bold mb-2">Withdrawal Initiated!</h4>
              <p className="text-sm text-gray-400 text-center mb-2">
                Your withdrawal of ${totalWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been initiated.
              </p>
              <p className="text-xs text-gray-400 mb-1">
                Withdrawal ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Estimated arrival: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
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

export default WithdrawFundsModal;