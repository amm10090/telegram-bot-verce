// src/components/Sidebar.tsx
import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Settings, Moon, Sun, Menu } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useTheme } from '@contexts/ThemeContext';
import { useRoutePreload } from '@hooks/useRoutePreload';
import { useSpring, a } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

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

// 手势事件接口
interface DragState {
  down: boolean;
  movement: [number, number];
  direction: [number, number];
  cancel: () => void;
}

// 导航链接组件
const NavLink = React.memo(({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
  const intl = useIntl();
  const pathname = usePathname();
  const { preloadRoute } = useRoutePreload();
  const isActive = pathname === item.path;

  // 处理鼠标悬停事件，触发预加载
  const handleMouseEnter = useCallback(() => {
    preloadRoute(item.path as any);
  }, [item.path, preloadRoute]);

  return (
    <Link
      key={item.labelId}
      href={item.path}
      className={`
        flex items-center px-4 py-2.5
        text-muted-foreground
        hover:text-foreground hover:bg-accent/50
        active:bg-accent/80
        rounded-md
        transition-all duration-200
        group
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring
        touch-target-large
        relative
        ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : ''}
      `}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      aria-current={isActive ? 'page' : undefined}
      role="menuitem"
    >
      <item.icon className={`
        h-5 w-5 mr-3 
        transition-colors
        ${isActive ? 'text-primary' : 'text-muted-foreground'}
        group-hover:text-foreground
      `} />
      <span className={`${isActive ? 'text-primary' : ''}`}>
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

  // 添加手势支持
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  
  const bind = useDrag(({ down, movement: [mx], direction: [dx], cancel }: DragState) => {
    if (down && Math.abs(mx) > 100) {
      cancel();
      setOpen(dx < 0);
    }
    api.start({ x: down ? mx : 0, immediate: down });
  }, {
    axis: 'x',
    bounds: { left: -100, right: 100 },
    rubberband: true,
  });

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
    setOpen(false);
  }, [setOpen]);

  return (
    <>
      {/* 移动端汉堡菜单按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="
          fixed top-3 left-2 z-50
          lg:hidden
          p-2 rounded-md
          bg-background
          hover:bg-accent
          focus:outline-none focus:ring-2 focus:ring-ring
          transition-colors duration-200
          touch-target-large
        "
        aria-label={intl.formatMessage({ 
          id: open ? 'nav.close' : 'nav.open' 
        })}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 遮罩层 - 仅在移动端且侧边栏打开时显示 */}
      {open && (
        <div 
          className="
            fixed inset-0 z-40
            bg-background/80 
            backdrop-blur-sm 
            lg:hidden
            transition-opacity
            cursor-pointer
          "
          onClick={handleMobileNavClick}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* 侧边栏主体 */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 
          h-screen lg:h-screen
          w-64 shrink-0
          bg-background border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-50 lg:z-0
        `}
        role="navigation"
        aria-label={intl.formatMessage({ id: 'nav.mainNavigation' })}
      >
        {/* Logo区域 */}
        <div className="h-14 flex items-center px-6 border-b border-border">
          <span className="text-lg font-semibold text-foreground truncate">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
        </div>

        {/* 导航菜单 */}
        <nav 
          className="flex-1 overflow-y-auto py-4"
          role="menu"
        >
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => (
              <NavLink
                key={item.labelId}
                item={item}
                onClick={handleMobileNavClick}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}