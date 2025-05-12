// src/pages/Learn.tsx
import React from 'react';
import { useTheme } from '../Context/ThemeContext';
import { Award, BarChart2, Activity, DollarSign, Shield } from 'lucide-react';

const Learn: React.FC = () => {
  const { theme } = useTheme();
  
  const courses = [
    {
      id: 'technical-analysis',
      title: 'Technical Analysis Basics',
      description: 'Learn to read charts, patterns and indicators',
      level: 'Beginner',
      lessons: 12,
      icon: <BarChart2 size={40} className="text-white" />,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'crypto-trading',
      title: 'Crypto Trading Strategies',
      description: 'Master cryptocurrency trading techniques',
      level: 'Intermediate',
      lessons: 8,
      icon: <Activity size={40} className="text-white" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'fiat-analysis',
      title: 'FIAT Currency Analysis',
      description: 'Understanding forex markets and pairs',
      level: 'Advanced',
      lessons: 10,
      icon: <DollarSign size={40} className="text-white" />,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'market-indicators',
      title: 'Market Indicators Deep Dive',
      description: 'Master technical indicators like RSI, MACD and more',
      level: 'Intermediate',
      lessons: 14,
      icon: <Activity size={40} className="text-white" />,
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'fundamental-analysis',
      title: 'Fundamental Analysis',
      description: 'Evaluate assets based on intrinsic value',
      level: 'Intermediate',
      lessons: 9,
      // src/pages/Learn.tsx (suite)
      icon: <BarChart2 size={40} className="text-white" />,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      description: 'Protect your investments with proper risk strategies',
      level: 'Beginner',
      lessons: 6,
      icon: <Shield size={40} className="text-white" />,
      color: 'from-red-500 to-pink-500'
    }
  ];
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Award className="mr-2 text-primary-500" size={24} />
          Learning Center
        </h2>
        <p className="text-gray-400 mt-1">Enhance your knowledge with our comprehensive courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div 
            key={course.id}
            className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg cursor-pointer hover:shadow-xl transition`}
          >
            <div className={`mb-3 h-32 rounded-lg bg-gradient-to-r ${course.color} flex items-center justify-center`}>
              {course.icon}
            </div>
            <h4 className="font-semibold mb-1">{course.title}</h4>
            <p className="text-sm text-gray-400 mb-3">{course.description}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs bg-opacity-20 px-2 py-1 rounded-full ${
                course.level === 'Beginner' ? 'bg-cyan-500 text-cyan-500' :
                course.level === 'Intermediate' ? 'bg-purple-500 text-purple-500' :
                'bg-amber-500 text-amber-500'
              }`}>
                {course.level}
              </span>
              <span className="text-xs text-gray-400">{course.lessons} lessons</span>
            </div>
            <button 
              className={`w-full mt-3 py-2 text-sm rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
            >
              Start Course
            </button>
          </div>
        ))}
      </div>
      
      <div className={`mt-8 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className="text-lg font-bold mb-2">Can't find what you're looking for?</h3>
        <p className="text-gray-400 mb-4">Suggest a new course or topic that you'd like to learn about.</p>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded transition">
          Suggest a Course
        </button>
      </div>
    </div>
  );
};

export default Learn;