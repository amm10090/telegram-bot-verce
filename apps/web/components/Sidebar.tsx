// src/components/Sidebar.tsx
import React, { useCallback } from 'react';
import Link from 'next/link';
import { Home, MessageCircle, Settings, Moon, Sun } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useTheme } from '@contexts/ThemeContext';
import { useRoutePreload } from '@hooks/useRoutePreload';

// 导航项接口定义
interface NavItem {
  path: string;
  icon: React.ElementType;
  labelId: string;
}

// 侧边栏组件的属性接口
interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// 导航链接组件
const NavLink = React.memo(({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
  const intl = useIntl();
  const { preloadRoute } = useRoutePreload();

  // 处理鼠标悬停事件，触发预加载
  const handleMouseEnter = useCallback(() => {
    preloadRoute(item.path as any);
  }, [item.path, preloadRoute]);

  return (
    <Link
      key={item.labelId}
      href={item.path}
      className="
        flex items-center px-4 py-2.5
        text-muted-foreground
        hover:text-foreground hover:bg-accent
        active:bg-accent/80
        rounded-md
        transition-all duration-200
        group
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring
      "
      onClick={onClick}
      onMouseEnter={handleMouseEnter}  // 添加鼠标悬停事件
      onFocus={handleMouseEnter}       // 添加焦点事件，支持键盘用户
    >
      <item.icon className="
        h-5 w-5 mr-3 
        transition-colors
        text-muted-foreground
        group-hover:text-foreground
      " />
      <span className="font-medium">
        {intl.formatMessage({ id: item.labelId })}
      </span>
    </Link>
  );
});

NavLink.displayName = 'NavLink';

/**
 * 侧边栏组件
 * - 提供应用主要导航功能
 * - 支持响应式设计
 * - 包含主题切换功能
 * - 实现路由组件预加载，提升用户体验
 */
export default function Sidebar({ open, setOpen }: SidebarProps) {
  const intl = useIntl();
  const { theme, setTheme } = useTheme();
  const { preloadAllRoutes } = useRoutePreload();

  // 在组件加载后，延迟预加载所有路由组件
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      preloadAllRoutes();
    }, 1000); // 延迟1秒开始预加载，避免影响首屏加载

    return () => clearTimeout(timeoutId);
  }, [preloadAllRoutes]);

  // 导航配置
  const navigationItems: NavItem[] = [
    {
      path: '/',
      icon: Home,
      labelId: 'nav.dashboard'
    },
    {
      path: '/bots',
      icon: MessageCircle,
      labelId: 'nav.bots'
    },
    {
      path: '/settings',
      icon: Settings,
      labelId: 'nav.settings'
    }
  ];

  // 处理移动端导航点击
  const handleMobileNavClick = useCallback(() => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [setOpen]);

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
        {/* 顶部Logo和主题切换区域 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <span className="text-lg font-semibold text-foreground truncate">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
          <div className="lg:hidden">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="
                flex items-center justify-center
                h-9 w-9
                rounded-md
                text-muted-foreground
                hover:text-foreground hover:bg-accent
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                transition-colors duration-200
              "
              aria-label={intl.formatMessage({ 
                id: theme === 'light' ? 'theme.dark' : 'theme.light' 
              })}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.labelId}
                item={item}
                onClick={handleMobileNavClick}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* 遮罩层 - 仅在移动端且侧边栏打开时显示 */}
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