import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Users, MessageCircle, Radio, AlertCircle, GitBranch, Clock, Database, Memory } from 'lucide-react';

const Dashboard = () => {
  // 扩展状态管理，添加部署和性能数据
  const [data, setData] = useState({
    botStatus: { 
      status: '正在运行', 
      uptimeHours: 0,
      mongoUser: '', 
      mongoStatus: '' 
    },
    dailyStats: { 
      totalMessages: 0, 
      activeUsers: 0, 
      commandsUsed: 0 
    },
    systemStatus: { 
      status: '正常', 
      lastUpdate: new Date().toLocaleString() 
    },
    messageHistory: [],
    systemLogs: [],
    deployment: {
      id: '',
      status: '',
      branch: '',
      environment: '',
      createdAt: '',
      url: ''
    },
    performance: {
      memoryUsage: 0,
      uptime: 0
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/start');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // 处理并更新数据
      setData({
        botStatus: {
          status: result.systemStatus?.status || '未知',
          uptimeHours: result.systemStatus?.uptimeHours || 0,
          mongoUser: result.systemStatus?.mongoUser || '未知',
          mongoStatus: result.systemStatus?.mongoStatus || '未连接'
        },
        dailyStats: {
          totalMessages: result.dailyStats?.总消息数 || 0,
          activeUsers: result.dailyStats?.活跃用户数 || 0,
          commandsUsed: result.dailyStats?.命令使用数 || 0
        },
        systemStatus: {
          status: result.systemStatus?.status === '活跃' ? '正常' : '异常',
          lastUpdate: result.systemStatus?.lastUpdate || new Date().toLocaleString()
        },
        messageHistory: Array.from({ length: 24 }, (_, i) => {
          const hourData = result.messageHistory?.find(item => item.小时 === i);
          return {
            hour: i,
            count: hourData?.数量 || 0,
            time: `${String(i).padStart(2, '0')}:00`
          };
        }),
        systemLogs: (result.systemLogs || []).map(log => ({
          timestamp: new Date(log.时间戳).toLocaleString(),
          message: log.消息,
          type: log.type || 'info'
        })),
        deployment: result.deployment || {
          id: '未知',
          status: '未知',
          branch: '未知',
          environment: 'production',
          createdAt: new Date().toLocaleString(),
          url: '#'
        },
        performance: result.performance || {
          memoryUsage: 0,
          uptime: 0
        }
      });
      setError(null);
    } catch (err) {
      setError('无法连接到服务器，请检查网络连接');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 基础样式定义
  const cardStyle = {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    margin: '8px',
    minHeight: '120px'
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

  // 状态指示器样式
  const statusIndicator = (status) => ({
    height: '12px',
    width: '12px',
    borderRadius: '50%',
    backgroundColor: status === '正常' || status === '活跃' || status === '正在运行' ? '#22c55e' : '#ef4444',
    marginRight: '8px',
    display: 'inline-block'
  });

  // 部署状态样式
  const deploymentStatusStyle = (status) => {
    const colors = {
      'READY': '#22c55e',
      'ERROR': '#ef4444',
      'BUILDING': '#f59e0b',
      'QUEUED': '#6366f1',
      'default': '#6b7280'
    };
    return { color: colors[status] || colors.default };
  };

  return (
    <div style={containerStyle}>
      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: '16px',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <AlertCircle style={{ marginRight: '8px', color: '#dc2626' }} />
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}
      
      {/* 加载状态 */}
      {loading && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#666'
        }}>
          正在加载数据...
        </div>
      )}

      {/* 状态卡片网格 */}
      <div style={gridStyle}>
        {/* Bot状态卡片 */}
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Radio style={{ marginRight: '8px' }} /> Bot 状态
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={statusIndicator(data.botStatus.status)} />
            {data.botStatus.status}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            运行时间: {Math.round(data.botStatus.uptimeHours)}小时
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            MongoDB用户: {data.botStatus.mongoUser}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            数据库状态: {data.botStatus.mongoStatus}
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={statusIndicator(data.systemStatus.status)} />
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {data.systemStatus.status}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            最后更新: {data.systemStatus.lastUpdate}
          </div>
        </div>
      </div>

      {/* 部署信息卡片 */}
      <div style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <GitBranch style={{ marginRight: '8px' }} /> 部署信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>分支：</span>
              <span style={{ fontWeight: 'bold' }}>{data.deployment.branch}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>环境：</span>
              <span>{data.deployment.environment}</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#666' }}>部署时间：</span>
              <span>{data.deployment.createdAt}</span>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>状态：</span>
              <span style={deploymentStatusStyle(data.deployment.status)}>
                {data.deployment.status}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#666' }}>部署ID：</span>
              <span style={{ fontFamily: 'monospace' }}>
                {data.deployment.id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 性能指标卡片 */}
      <div style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Memory style={{ marginRight: '8px' }} /> 性能指标
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {data.performance.memoryUsage} MB
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>内存使用</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {data.performance.uptime} 小时
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>运行时间</div>
          </div>
        </div>
      </div>

      {/* 消息趋势图表 */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px' }}>消息趋势</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.messageHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [`${value} 条消息`, '消息数']}
                labelFormatter={(label) => `${label} 时`}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6" 
                name="消息数"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 系统日志 */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px' }}>系统日志</h3>
        <div style={{ 
          height: '300px', 
          overflowY: 'auto',
          padding: '8px',
          background: '#f9fafb',
          borderRadius: '4px'
        }}>
          {data.systemLogs.length > 0 ? (
            data.systemLogs.map((log, index) => (
              <div key={index} style={{ 
                fontSize: '14px', 
                marginBottom: '8px',
                padding: '8px',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#666', display: 'block', marginBottom: '4px' }}>
                  {log.timestamp}
                </span>
                <span style={{ 
color: log.type === 'error' ? '#dc2626' : 
                         log.type === 'warning' ? '#f59e0b' : '#1f2937'
                }}>
                  {log.message}
                </span>
                {log.details && (
                  <div style={{ 
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#666',
                    fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(log.details, null, 2)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#666', paddingTop: '20px' }}>
              暂无系统日志
            </div>
          )}
        </div>
      </div>

      {/* 最后一次更新时间提示 */}
      <div style={{ 
        textAlign: 'center', 
        color: '#666',
        fontSize: '12px',
        marginTop: '20px' 
      }}>
        数据更新时间：{data.systemStatus.lastUpdate}
      </div>
    </div>
  );
};

export default Dashboard;