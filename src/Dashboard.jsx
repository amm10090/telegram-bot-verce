// Dashboard.jsx - Telegram Bot 管理面板主组件
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Users, MessageCircle, Radio, AlertCircle, GitBranch, Clock, Database, Memory } from 'lucide-react';

// 加载状态组件 - 显示数据加载过程中的提示和动画
const LoadingState = () => (
    <div style={{
        padding: '40px',
        margin: '20px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.3s ease-in-out'
    }}>
        {/* 加载动画容器 */}
        <div style={{ marginBottom: '16px' }}>
            {/* 自定义加载动画 */}
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }} />
            正在加载数据...
        </div>
        {/* 加载提示信息 */}
        <div style={{ fontSize: '14px', color: '#888' }}>
            首次加载可能需要几秒钟
        </div>
    </div>
);

// 错误状态组件 - 显示错误信息和重试按钮
const ErrorState = ({ error, onRetry }) => (
    <div style={{
        padding: '32px',
        margin: '20px',
        background: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        textAlign: 'center'
    }}>
        {/* 错误信息显示 */}
        <div style={{ 
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 'bold'
        }}>
            {error || '加载失败'}
        </div>
        {/* 重试按钮 */}
        <button
            onClick={onRetry}
            style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
            }}
        >
            重试
        </button>
    </div>
);

// 主面板组件
const Dashboard = () => {
    // 状态管理 - 定义所有需要的状态变量
    const [data, setData] = useState({
        // Bot状态信息
        botStatus: { 
            status: '等待连接', 
            uptimeHours: 0,
            mongoUser: '加载中', 
            mongoStatus: '等待连接' 
        },
        // 每日统计数据
        dailyStats: { 
            totalMessages: 0, 
            activeUsers: 0, 
            commandsUsed: 0 
        },
        // 系统状态信息
        systemStatus: { 
            status: '正常', 
            lastUpdate: new Date().toLocaleString() 
        },
        // 消息历史数据
        messageHistory: [],
        // 系统日志数据
        systemLogs: [],
        // 部署信息
        deployment: {
            id: '',
            status: '',
            branch: '',
            environment: '',
            createdAt: '',
            url: ''
        },
        // 性能指标
        performance: {
            memoryUsage: 0,
            uptime: 0
        }
    });

    // 错误状态管理
    const [error, setError] = useState(null);
    // 加载状态管理
    const [loading, setLoading] = useState(true);

    // 数据获取函数 - 从后端API获取所有必要数据
    const fetchData = async () => {
        try {
            // 开始加载，记录日志
            console.log('开始获取数据');
            setLoading(true);

            // 发起API请求
            const response = await fetch('/api/start');
            console.log('API响应状态:', response.status);
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            // 解析响应数据
            const result = await response.json();
            
            // 更新状态数据
            setData({
                // Bot状态更新
                botStatus: {
                    status: result.systemStatus?.status || '未知',
                    uptimeHours: result.systemStatus?.uptimeHours || 0,
                    mongoUser: result.systemStatus?.mongoUser || '未知',
                    mongoStatus: result.systemStatus?.mongoStatus || '未连接'
                },
                // 每日统计更新
                dailyStats: {
                    totalMessages: result.dailyStats?.总消息数 || 0,
                    activeUsers: result.dailyStats?.活跃用户数 || 0,
                    commandsUsed: result.dailyStats?.命令使用数 || 0
                },
                // 系统状态更新
                systemStatus: {
                    status: result.systemStatus?.status === '活跃' ? '正常' : '异常',
                    lastUpdate: result.systemStatus?.lastUpdate || new Date().toLocaleString()
                },
                // 消息历史数据处理 - 确保24小时数据完整
                messageHistory: Array.from({ length: 24 }, (_, i) => {
                    const hourData = result.messageHistory?.find(item => item.小时 === i);
                    return {
                        hour: i,
                        count: hourData?.数量 || 0,
                        time: `${String(i).padStart(2, '0')}:00`
                    };
                }),
                // 系统日志处理
                systemLogs: (result.systemLogs || []).map(log => ({
                    timestamp: new Date(log.时间戳).toLocaleString(),
                    message: log.消息,
                    type: log.type || 'info',
                    details: log.details
                })),
                // 部署信息更新
                deployment: result.deployment || {
                    id: '未知',
                    status: '未知',
                    branch: '未知',
                    environment: 'production',
                    createdAt: new Date().toLocaleString(),
                    url: '#'
                },
                // 性能指标更新
                performance: result.performance || {
                    memoryUsage: 0,
                    uptime: 0
                }
            });

            // 清除错误状态
            setError(null);

        } catch (err) {
            // 错误处理和日志记录
            console.error('数据获取错误:', err);
            setError(err.message || '无法连接到服务器，请检查网络连接');
        } finally {
            // 完成加载
            setLoading(false);
        }
    };

    // 初始化和定时器设置
    useEffect(() => {
        // 组件挂载日志
        console.log('Dashboard 组件已挂载');
        
        // 首次数据获取
        fetchData();
        
        // 设置定时刷新（30秒间隔）
        const interval = setInterval(fetchData, 30000);
        
        // 清理函数
        return () => {
            console.log('Dashboard 组件已卸载');
            clearInterval(interval);
        };
    }, []);

    // 基础样式定义 - 使用状态管理避免重复创建
    const [styles] = useState({
        // 容器样式
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        },
        // 网格布局样式
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
        },
        // 卡片基础样式
        card: {
            background: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            margin: '8px',
            minHeight: '120px'
        }
    });

    // 状态指示器样式生成函数
    const getStatusIndicator = (status) => ({
        height: '12px',
        width: '12px',
        borderRadius: '50%',
        backgroundColor: status === '正常' || status === '活跃' || status === '正在运行' ? '#22c55e' : '#ef4444',
        marginRight: '8px',
        display: 'inline-block'
    });

    // 部署状态样式生成函数
    const getDeploymentStatusStyle = (status) => {
        const colors = {
            'READY': '#22c55e',
            'ERROR': '#ef4444',
            'BUILDING': '#f59e0b',
            'QUEUED': '#6366f1',
            'default': '#6b7280'
        };
        return { color: colors[status] || colors.default };
    };

    // 主要内容渲染函数
    const renderMainContent = () => (
        <>
            {/* 状态卡片网格 */}
            <div style={styles.grid}>
                {/* Bot状态卡片 */}
                <div style={styles.card}>
                    <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <Radio style={{ marginRight: '8px' }} /> Bot 状态
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={getStatusIndicator(data.botStatus.status)} />
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
                <div style={styles.card}>
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
                <div style={styles.card}>
                    <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <Users style={{ marginRight: '8px' }} /> 活跃用户数
                    </h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                        {data.dailyStats.activeUsers}
                    </div>
                </div>

                {/* 系统状态卡片 */}
                <div style={styles.card}>
                    <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <Activity style={{ marginRight: '8px' }} /> 系统状态
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={getStatusIndicator(data.systemStatus.status)} />
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
            <div style={styles.card}>
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
                            <span style={getDeploymentStatusStyle(data.deployment.status)}>
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
            <div style={styles.card}>
                <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <Memory style={{ marginRight: '8px' }} /> 性能指标
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* 内存使用指标 */}
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                            {data.performance.memoryUsage} MB
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>内存使用</div>
                    </div>
                    {/* 运行时间指标 */}
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                            {data.performance.uptime} 小时
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>运行时间</div>
                    </div>
                </div>
            </div>

            {/* 消息趋势图表 */}
            <div style={styles.card}>
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

            {/* 系统日志显示区域 */}
            <div style={styles.card}>
                <h3 style={{ marginBottom: '16px' }}>系统日志</h3>
                <div style={{ 
                    height: '300px', 
                    overflowY: 'auto',
                    padding: '8px',
                    background: '#f9fafb',
                    borderRadius: '4px'
                }}>
                    {/* 日志条目渲染 */}
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
                                {/* 日志时间戳 */}
                                <span style={{ color: '#666', display: 'block', marginBottom: '4px' }}>
                                    {log.timestamp}
                                </span>
                                {/* 日志消息 */}
                                <span style={{ 
                                    color: log.type === 'error' ? '#dc2626' : 
                                           log.type === 'warning' ? '#f59e0b' : '#1f2937'
                                }}>
                                    {log.message}
                                </span>
                                {/* 日志详细信息（如果有） */}
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
                        // 无日志时的提示
                        <div style={{ textAlign: 'center', color: '#666', paddingTop: '20px' }}>
                            暂无系统日志
                        </div>
                    )}
                </div>
            </div>

            {/* 最后更新时间提示 */}
            <div style={{ 
                textAlign: 'center', 
                color: '#666',
                fontSize: '12px',
                marginTop: '20px' 
            }}>
                数据更新时间：{data.systemStatus.lastUpdate}
            </div>
        </>
    );

    // 最终渲染逻辑
    return (
        <div style={styles.container}>
            {/* 根据状态选择显示加载、错误或主要内容 */}
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState 
                    error={error}
                    onRetry={() => {
                        setError(null);
                        fetchData();
                    }}
                />
            ) : (
                renderMainContent()
            )}
        </div>
    );
};

export default Dashboard;