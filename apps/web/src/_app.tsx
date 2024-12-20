import React from 'react';
import './styles/globals.css';
import { BrowserRouter } from 'react-router-dom';
import { LocaleProvider } from './contexts/LocaleContext';
import Layout from './components/Layout';
import MainContent from './components/MainContent';

/**
 * App组件是整个应用的根组件
 * 它负责设置全局的上下文提供者和布局结构
 */
interface AppProps {
  Component?: React.ComponentType;
  pageProps?: any;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    // LocaleProvider 提供国际化支持，必须在最外层
    <LocaleProvider>
      {/* BrowserRouter 提供路由功能 */}
      <BrowserRouter>
        {/* Layout 组件提供页面的基础布局结构 */}
        <Layout  defaultSidebarState={false}>
          {/* 渲染传入的组件或默认的主内容组件 */}
          {Component ? (
            <Component {...pageProps} />
          ) : (
            <MainContent />
          )}
        </Layout>
      </BrowserRouter>
    </LocaleProvider>
  );
}