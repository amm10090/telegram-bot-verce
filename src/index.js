// index.js
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary.jsx';

// 使用 React.lazy 动态导入 Dashboard 组件
const Dashboard = React.lazy(() => import('./Dashboard.jsx'));

// 全局加载状态组件
const GlobalLoadingState = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
    }}>
        正在加载应用...
    </div>
);

// 获取根元素并创建 React 根实例
const container = document.getElementById('root');
const root = createRoot(container);

// 渲染应用
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Suspense fallback={<GlobalLoadingState />}>
                <Dashboard />
            </Suspense>
        </ErrorBoundary>
    </React.StrictMode>
);