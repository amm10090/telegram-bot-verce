import React, { useState, useEffect } from 'react';
import { Cpu, MessageCircle, Users, Activity, Clock, Database, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusCard from './components/StatusCard';
import MetricsCard from './components/MetricsCard';
import SystemHealth from './components/SystemHealth';
import ErrorLog from './components/ErrorLog';
import PerformanceChart from './components/PerformanceChart';

const Dashboard = () => {
  const [data, setData] = useState({
    botStatus: {
      status: 'connecting',
      uptime: 0,
      lastActive: null
    },
    metrics: {
      messageCount: 0,
      activeUsers: 0,
      errorCount: 0
    },
    performance: {
      cpu: 0,
      memory: 0,
      latency: 0
    },
    errors: [],
    healthChecks: {}
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/start');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || '获取数据失败');
        }

        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-8 rounded-lg text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">数据加载失败</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Telegram Bot 监控面板
        </h1>

        {/* 状态卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="系统状态"
            value={data.botStatus.status}
            icon={<Activity className="w-6 h-6" />}
            type={data.botStatus.status === 'active' ? 'success' : 'warning'}
          />
          <StatusCard
            title="消息总数"
            value={data.metrics.messageCount}
            icon={<MessageCircle className="w-6 h-6" />}
            type="info"
          />
          <StatusCard
            title="活跃用户"
            value={data.metrics.activeUsers}
            icon={<Users className="w-6 h-6" />}
            type="info"
          />
          <StatusCard
            title="运行时间"
            value={`${Math.floor(data.botStatus.uptime / 3600)}小时`}
            icon={<Clock className="w-6 h-6" />}
            type="info"
          />
        </div>

        {/* 性能监控区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">性能监控</h2>
            <div className="h-80">
              <PerformanceChart data={data.performance} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">系统健康状态</h2>
            <SystemHealth healthChecks={data.healthChecks} />
          </div>
        </div>

        {/* 错误日志区域 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">错误日志</h2>
          <ErrorLog errors={data.errors} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;