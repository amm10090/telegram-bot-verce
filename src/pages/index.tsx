// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';
import { LocaleProvider } from '../contexts/LocaleContext';
import '../styles/globals.css';

function App() {
  return (
    <LocaleProvider>
      <Layout maxWidth="xl" defaultSidebarState={false}>
        <MainContent />
      </Layout>
    </LocaleProvider>
  );
}

// 仅在浏览器环境下执行渲染
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