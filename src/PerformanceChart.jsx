import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ data }) => {
  const formatData = (performanceData) => {
    const now = Date.now();
    return Array.from({ length: 30 }, (_, i) => ({
      time: new Date(now - (29 - i) * 60000).toLocaleTimeString(),
      cpu: performanceData.cpu,
      memory: performanceData.memory,
      latency: performanceData.latency
    }));
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatData(data)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#6b7280' }}
          tickFormatter={(value) => value.split(':')[0] + ':' + value.split(':')[1]}
        />
        <YAxis tick={{ fill: '#6b7280' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="cpu" 
          stroke="#3b82f6" 
          name="CPU使用率"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="memory" 
          stroke="#10b981" 
          name="内存使用"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="latency" 
          stroke="#f59e0b" 
          name="响应延迟"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;