// src/components/Sidebar.tsx
import React from 'react';
import { Home, MessageCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useIntl } from 'react-intl';

// 定义导航项的类型，使代码更容易维护
interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
}

// 定义组件的属性类型
interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const intl = useIntl();

  // 将导航项配置抽离出来，便于维护和扩展
  const navigationItems: NavItem[] = [
    {
      href: '/',
      icon: Home,
      labelKey: 'nav.dashboard'
    },
    {
      href: '/bots',
      icon: MessageCircle,
      labelKey: 'nav.bots'
    },
    {
      href: '/settings',
      icon: Settings,
      labelKey: 'nav.settings'
    }
  ];

  return (
    <>
      {/* 侧边栏主体 */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30
          w-64 flex flex-col
          bg-background border-r border-border
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 顶部 Logo 区域 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <span className="text-xl font-semibold text-foreground">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
          <ThemeToggle />
        </div>

        {/* 导航菜单区域 */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
<Link
  key={item.labelKey}
  href={item.href}
  className="
    flex items-center px-4 py-2.5
    text-muted-foreground
    hover:text-foreground
    hover:bg-accent
    active:bg-accent/80
    rounded-md
    transition-all duration-200
    group
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-ring
  "
>
  <item.icon className="
    h-5 w-5 mr-3 
    transition-colors
    group-hover:text-foreground
  " />
  <span className="font-medium">{intl.formatMessage({ id: item.labelKey })}</span>
</Link>
            ))}
          </div>
        </nav>
      </div>

      {/* 移动端遮罩层 */}
      {open && (
        <div 
          className="
            fixed inset-0 z-20 
            bg-background/80 
            backdrop-blur-sm 
            lg:hidden
            transition-opacity
          "
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}