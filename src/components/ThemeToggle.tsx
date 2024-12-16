// src/components/ThemeToggle.tsx
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

export default function ThemeToggle() {
  // 使用next-themes提供的hook来管理主题
  const { theme, setTheme } = useTheme();
  const intl = useIntl();
  
  // 用于处理服务端渲染和客户端渲染不匹配的问题
  const [mounted, setMounted] = useState(false);

  // 组件挂载后再显示，避免服务端渲染和客户端渲染的主题状态不一致
  useEffect(() => {
    setMounted(true);
  }, []);

  // 如果组件未挂载，返回null避免闪烁
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-400 hover:text-gray-500 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      aria-label={theme === 'dark' 
        ? intl.formatMessage({ id: 'theme.light' })
        : intl.formatMessage({ id: 'theme.dark' })
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}