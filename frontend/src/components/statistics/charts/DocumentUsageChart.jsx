import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg p-3 text-sm backdrop-blur-sm">
        <p className="font-medium text-white mb-1">{payload[0].payload.name}</p>
        <p className="text-purple-300">Interactions: <span className="text-white font-medium">{payload[0].value}</span></p>
      </div>
    );
  }

  return null;
};

const DocumentUsageChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  if (!data || !data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-800/40 rounded-lg border border-slate-700/50 p-6">
        <p className="text-slate-400 text-center">No document usage data available yet.</p>
      </div>
    );
  }

  // Ensures each item has a name
  const formattedData = data.map(item => ({
    ...item,
    name: item.filename || 'Unnamed Document'
  }));

  // base colors
  const getBarColor = (index, isActive) => {
    const baseColor = '#60a5fa'; // blue-400
    const opacity = isActive ? '1' : '0.7';
    return `${baseColor}${opacity === '1' ? '' : 'b3'}`; // b3 is ~70% opacity in hex
  };

  return (
    <div className="h-64 w-full bg-white/5 rounded-lg p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
          onMouseMove={(data) => {
            if (data && data.activeTooltipIndex !== undefined) {
              setActiveIndex(data.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickMargin={8}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickMargin={8}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 0 }} // Position the tooltip above the bar
          />
          <Bar 
            dataKey="interactions"
            radius={[4, 4, 0, 0]}
          >
            {formattedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index, index === activeIndex)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DocumentUsageChart;