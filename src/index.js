import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './Dashboard';

// 全局加载状态组件
const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">正在加载应用...</p>
        </div>
    </div>
);

// 异步加载主应用
const App = () => (
    <React.StrictMode>
        <ErrorBoundary>
            <React.Suspense fallback={<LoadingScreen />}>
                <Dashboard />
            </React.Suspense>
        </ErrorBoundary>
    </React.StrictMode>
);

// 渲染应用
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);