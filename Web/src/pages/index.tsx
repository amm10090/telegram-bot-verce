// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';  // 添加这行
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';
import { LocaleProvider } from '../contexts/LocaleContext';
import '../styles/globals.css';

/**
 * 主应用组件
 * 这里设置了应用的基础结构和全局提供者的配置
 * 提供者的顺序很重要：
 * 1. ThemeProvider：最外层，提供主题支持
 * 2. BrowserRouter：提供路由功能
 * 3. LocaleProvider：提供国际化支持
 * 4. Layout：提供应用的整体布局框架
 */
function App() {
  return (
    // ThemeProvider 仍然在最外层，处理主题
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
      storageKey="tg-bot-theme"
      themes={['light', 'dark']}
    >
      {/* BrowserRouter 提供路由功能 */}
      <BrowserRouter>
        {/* LocaleProvider 处理国际化 */}
        <LocaleProvider>
          {/* Layout 组件包含整体页面结构 */}
          <Layout maxWidth="xl" defaultSidebarState={false}>
            {/* MainContent 负责内容区域的路由管理 */}
            <MainContent />
          </Layout>
        </LocaleProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

/**
 * 应用渲染逻辑保持不变
 * React.StrictMode 帮助我们在开发时发现潜在问题
 */
if (typeof window !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

export default App;