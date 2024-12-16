// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';
import { LocaleProvider } from '../contexts/LocaleContext';
import '../styles/globals.css';

/**
 * 主应用组件
 * 这里设置了应用的基础结构和全局提供者的配置
 * ThemeProvider 必须是最外层的提供者，以确保主题系统在整个应用中正常工作
 */
function App() {
  return (
    // ThemeProvider 放在最外层，使主题系统能够覆盖整个应用
    <ThemeProvider
      attribute="class"          // 使用 class 属性来切换主题
      defaultTheme="system"      // 默认跟随系统主题
      enableSystem={true}        // 启用系统主题跟随
      disableTransitionOnChange  // 禁用主题切换时的过渡动画，避免闪烁
      storageKey="tg-bot-theme"  // 自定义存储键，避免与其他应用冲突
      themes={['light', 'dark']} // 明确指定支持的主题类型
    >
      {/* LocaleProvider 处理国际化 */}
      <LocaleProvider>
        {/* Layout 组件设置为不默认展开侧边栏，最大宽度使用 xl */}
        <Layout maxWidth="xl" defaultSidebarState={false}>
          {/* MainContent 组件包含仪表盘的主要内容 */}
          <MainContent />
        </Layout>
      </LocaleProvider>
    </ThemeProvider>
  );
}

/**
 * 应用渲染逻辑
 * 使用条件检查确保只在浏览器环境下执行渲染
 * 这样可以避免服务器端渲染时的问题
 */
if (typeof window !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    // 使用严格模式包裹应用，帮助发现潜在问题
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

// 导出 App 组件供其他地方使用
export default App;