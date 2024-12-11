import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// 使用React.lazy动态导入Dashboard组件
const Dashboard = React.lazy(() => import('./Dashboard'));

// 添加加载状态显示
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
    }}>
        加载中...
    </div>
);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
        </Suspense>
    </React.StrictMode>
);