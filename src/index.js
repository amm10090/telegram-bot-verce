// index.js
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = React.lazy(() => import('./Dashboard'));

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

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Suspense fallback={<GlobalLoadingState />}>
                <Dashboard />
            </Suspense>
        </ErrorBoundary>
    </React.StrictMode>
);