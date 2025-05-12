// src/pages/auth/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import { BarChart2, Lock, Mail, User, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation des champs
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center"
        style={{
          background: theme === 'dark' ? '#111827' : '#f3f4f6',
        }}>
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg mx-auto
        ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 
              bg-primary-500 rounded-full mb-4 w-16 h-16 mx-auto">
            <BarChart2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">AI Market Analyst</h1>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Create your account
          </p>
        </div>
        
        {error && (
          <div className={`p-3 mb-4 rounded-md flex items-center
            ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Full Name
            </label>
            <div className={`flex items-center ${theme === 'dark' ? 
              'bg-gray-700' : 'bg-gray-100'} rounded-md px-3 py-2
              focus-within:ring-2 focus-within:ring-primary-500`}>
              <User size={16} className="text-gray-400 mr-2" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`bg-transparent w-full focus:outline-none
                ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <div className={`flex items-center ${theme === 'dark' ? 
              'bg-gray-700' : 'bg-gray-100'} rounded-md px-3 py-2
              focus-within:ring-2 focus-within:ring-primary-500`}>
              <Mail size={16} className="text-gray-400 mr-2" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`bg-transparent w-full focus:outline-none
                ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <div className={`flex items-center ${theme === 'dark' ? 
              'bg-gray-700' : 'bg-gray-100'} rounded-md px-3 py-2
              focus-within:ring-2 focus-within:ring-primary-500`}>
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`bg-transparent w-full focus:outline-none
                ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className={`flex items-center ${theme === 'dark' ? 
              'bg-gray-700' : 'bg-gray-100'} rounded-md px-3 py-2
              focus-within:ring-2 focus-within:ring-primary-500`}>
              <Lock size={16} className="text-gray-400 mr-2" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`bg-transparent w-full focus:outline-none
                ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-primary-500
              hover:bg-primary-600 text-white rounded-md font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-primary-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" 
                      stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;