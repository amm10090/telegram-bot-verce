import React from 'react';
import { Menu, Bell, User } from 'lucide-react';

export default function Header({
  sidebarOpen,
  setSidebarOpen
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-500 dark:text-gray-200 lg:hidden focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              User
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}