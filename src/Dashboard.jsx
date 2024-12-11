import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Users, MessageCircle, Radio } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState({
    botStatus: { status: '正在运行', uptimeHours: 0 },
    dailyStats: { totalMessages: 0, activeUsers: 0, commandsUsed: 0 },
    systemStatus: { status: '正常', lastUpdate: new Date().toLocaleString() },
    messageHistory: [],
    systemLogs: []
  });
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/start');
      if (!response.ok) {
        throw new Error('API 请求失败');
      }
      const result = await response.json();
      
      setData({
        botStatus: {
          status: result.systemStatus?.status || '正在运行',
          uptimeHours: result.systemStatus?.uptimeHours || 0
        },
        dailyStats: {
          totalMessages: result.dailyStats?.总消息数 || 0,
          activeUsers: result.dailyStats?.活跃用户数 || 0,
          commandsUsed: result.dailyStats?.命令使用数 || 0
        },
        systemStatus: {
          status: result.systemStatus?.status === '活跃' ? '正常' : '连接错误',
          lastUpdate: new Date().toLocaleString()
        },
        messageHistory: result.messageHistory?.map(item => ({
          hour: item.小时,
          count: item.数量
        })) || [],
        systemLogs: result.systemLogs?.map(log => ({
          timestamp: log.时间戳,
          message: log.消息
        })) || []
      });
      setError(null);
    } catch (err) {
      setError('无法连接到服务器，请检查网络连接');
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 定义卡片样式
  const cardStyle = {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    margin: '8px'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  };

  return (
    <div style={containerStyle}>
      {error && (
        <div style={{
          padding: '16px',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}
      
      <div style={gridStyle}>
        {/* Bot状态卡片 */}
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Radio style={{ marginRight: '8px' }} /> Bot 状态
          </h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              height: '12px',
              width: '12px',
              borderRadius: '50%',
              backgroundColor: data.botStatus.status === '正在运行' ? '#22c55e' : '#ef4444',
              marginRight: '8px'
            }} />
            {data.botStatus.status}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            运行时间: {Math.round(data.botStatus.uptimeHours)}小时
          </div>
        </div>

        {/* 今日消息数卡片 */}
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <MessageCircle style={{ marginRight: '8px' }} /> 今日消息数
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {data.dailyStats.totalMessages}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            命令使用: {data.dailyStats.commandsUsed}
          </div>
        </div>

        {/* 活跃用户数卡片 */}
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Users style={{ marginRight: '8px' }} /> 活跃用户数
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {data.dailyStats.activeUsers}
          </div>
        </div>

        {/* 系统状态卡片 */}
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Activity style={{ marginRight: '8px' }} /> 系统状态
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {data.systemStatus.status}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            最后更新: {data.systemStatus.lastUpdate}
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px' }}>消息趋势</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.messageHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 系统日志 */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px' }}>系统日志</h3>
        <div style={{ height: '300px', overflowY: 'auto' }}>
          {data.systemLogs.map((log, index) => (
            <div key={index} style={{ fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#666' }}>{new Date(log.timestamp).toLocaleString()}</span>
              <span style={{ marginLeft: '8px' }}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;