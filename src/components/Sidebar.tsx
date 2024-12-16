import React from 'react';
import { Home, MessageCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ 
  open, 
  setOpen 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void;
}) {
  return (
    <>
      {/* 侧边栏保持固定定位 */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg 
        transform transition-transform duration-300 ease-in-out 
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-30`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
            <span className="text-xl font-semibold text-gray-800 dark:text-white">
              TG Bot 管理面板
            </span>
            <ThemeToggle />
          </div>
          <nav className="flex-1 mt-6 px-6 space-y-2 overflow-y-auto">
            <Link href="/" className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/bots" className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <MessageCircle className="h-5 w-5" />
              <span>Bots</span>
            </Link>
            <Link href="/settings" className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* 遮罩层 */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden z-20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}