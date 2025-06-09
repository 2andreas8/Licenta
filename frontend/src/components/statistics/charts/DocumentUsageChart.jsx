import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DocumentUsageChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-lg border border-purple-300/20 p-6">
        <div className="text-purple-200/50 mb-3 text-4xl">📊</div>
        <p className="text-gray-300 text-lg">No Data available</p>
        <p className="text-gray-400 text-sm mt-2">Upload more documents to see statistics</p>
      </div>
    );
  }

  console.log('DocumentUsageChart data:', data);

  const processedData = data.map(item => ({
    name: item.filename ? (item.filename.length > 15 ? item.filename.substring(0, 15) + '...' : item.filename) : 'Unnamed Document',
    interactions: item.interactions || 0
  }));
  
  const COLORS = ['#8884d8', '#a78bfa', '#c084fc', '#d946ef', '#e879f9'];
  
  return (
    <div className="h-64 w-full bg-white/5 rounded-lg p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={processedData}
          margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#e2e8f0' }}
          />
          <YAxis tick={{ fill: '#e2e8f0' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 27, 75, 0.9)', 
              border: '1px solid #8b5cf6',
              borderRadius: '0.5rem',
              color: 'white'
            }}
          />
          <Bar dataKey="interactions" radius={[4, 4, 0, 0]}>
            {processedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DocumentUsageChart;