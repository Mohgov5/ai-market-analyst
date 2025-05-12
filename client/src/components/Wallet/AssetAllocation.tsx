// src/components/wallet/AssetAllocation.tsx
import React from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AssetAllocation: React.FC = () => {
  const { theme } = useTheme();
  
  // Mock asset allocation data
  const assetData = [
    { name: 'Stocks', value: 45, color: '#10B981' },
    { name: 'Crypto', value: 30, color: '#3B82F6' },
    { name: 'Forex', value: 15, color: '#8B5CF6' },
    { name: 'Commodities', value: 10, color: '#F59E0B' },
  ];
  
  return (
    <div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assetData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {assetData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, 'Allocation']}
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                color: theme === 'dark' ? '#f9fafb' : '#111827'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        {assetData.map((asset, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: asset.color }}
            ></div>
            <span className="text-xs">{asset.name}: {asset.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocation;