// src/index.tsx
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';
import { LocaleProvider } from '../contexts/LocaleContext';
import '../styles/globals.css';

/**
 * 错误边界组件
 * 用于捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">抱歉，出现了一些问题</h1>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 加载状态组件
 * 在内容加载时显示的占位符
 */
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-2">加载中...</p>
    </div>
  </div>
);

/**
 * 主应用组件
 * 负责设置应用的基础结构和全局配置
 */
function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
          storageKey="tg-bot-theme"
          themes={['light', 'dark']}
        >
          <BrowserRouter>
            <LocaleProvider>
              <Layout maxWidth="2xl" defaultSidebarState={false}>
                <MainContent />
              </Layout>
            </LocaleProvider>
          </BrowserRouter>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

// 应用渲染逻辑
if (typeof window !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('未找到根元素 #root');
  }
}

export default App;