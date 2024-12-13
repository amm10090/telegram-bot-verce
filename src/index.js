// index.js - 应用入口文件
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// 使用React.lazy动态导入Dashboard组件，注意添加.jsx扩展名
const Dashboard = React.lazy(() => import('./Dashboard.jsx'));

// 加载状态组件
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#666',
        fontSize: '16px'
    }}>
        加载中...
    </div>
);

// 获取根元素并创建React根实例
const container = document.getElementById('root');
const root = createRoot(container);

// 渲染应用
root.render(
    <React.StrictMode>
        <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
        </Suspense>
    </React.StrictMode>
);