// src/index.tsx
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 导入全局样式
import './styles/globals.css';

// 导入组件和上下文
import Layout from './components/Layout';
import MainContent from './components/MainContent';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';

// 定义错误边界组件的类型
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 错误边界组件
 * 用于捕获和处理渲染过程中的错误
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 正确初始化构造函数和状态
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  // 从错误中派生新状态
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  // 记录错误信息
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('应用错误:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center p-4">
            <h2 className="text-2xl font-bold mb-4">抱歉，出现了一些问题</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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
 * 在内容加载时显示的友好界面
 */
const LoadingFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-2 text-foreground">加载中...</p>
    </div>
  </div>
);

/**
 * 应用的根组件
 * 包含了所有必要的上下文提供者和核心布局
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ThemeProvider
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <LocaleProvider>
            <BrowserRouter>
              <Layout defaultSidebarState={false}>
                <MainContent />
              </Layout>
            </BrowserRouter>
          </LocaleProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
};

// 获取根元素并渲染应用
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

export default App;