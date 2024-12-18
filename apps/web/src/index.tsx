import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 导入全局样式
import './styles/globals.css';

// 导入组件和上下文
import Layout from './components/Layout';
import MainContent from './components/MainContent';
import { LocaleProvider } from './contexts/LocaleContext';
import { ThemeProvider } from './contexts/ThemeContext';  // 添加主题提供者导入

/**
 * 应用的根组件
 * 包含了所有必要的上下文提供者和核心布局
 */
function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {/* ThemeProvider 必须包裹在最外层，以便主题效果能够渗透到所有子组件 */}
        <ThemeProvider
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <LocaleProvider>
            <BrowserRouter>
              <Layout maxWidth="2xl" defaultSidebarState={false}>
                <MainContent />
              </Layout>
            </BrowserRouter>
          </LocaleProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * 错误边界组件
 * 用于捕获和处理渲染过程中的错误
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo);
  }

  render() {
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
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="mt-2 text-foreground">加载中...</p>
    </div>
  </div>
);

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