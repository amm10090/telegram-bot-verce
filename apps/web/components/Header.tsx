// src/components/Header.tsx
import React from 'react';
import { Menu, Bell, User, Search, Moon, Sun } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useTheme } from '@contexts/ThemeContext';
import LanguageSwitcher from '@components/LanguageSwitcher';

// 定义组件的属性接口
interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen
}: HeaderProps) {
  const intl = useIntl();
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-2 sm:px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mr-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex-1 flex items-center justify-between space-x-2 sm:space-x-4">
          <div className="flex items-center flex-1 max-w-[200px] sm:max-w-[300px]">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={intl.formatMessage({ id: 'search.placeholder' })}
                className="h-9 w-full rounded-md border bg-background px-8 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            <LanguageSwitcher />
            
            <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
              <Bell className="h-5 w-5" />
            </button>
            
            <button className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}