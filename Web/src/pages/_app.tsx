// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider } from '../contexts/LocaleContext'
import React from 'react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    // 主题提供者配置
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      {/* 国际化提供者配置 */}
      <LocaleProvider>
        {/* 渲染主应用组件 */}
        <Component {...pageProps} />
      </LocaleProvider>
    </ThemeProvider>
  )
}