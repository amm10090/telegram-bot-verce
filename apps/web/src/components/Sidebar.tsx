// src/components/Sidebar.tsx
import React from 'react';
import { Home, MessageCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { useIntl } from 'react-intl';
import { Moon, Sun } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const intl = useIntl();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="
        flex items-center justify-center
        h-9 w-9 sm:h-10 sm:w-10
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
  );
};
export default function Sidebar({ open, setOpen }: SidebarProps) {
  const intl = useIntl();

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
      {/* 响应式侧边栏主体 */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30
          w-64 flex flex-col
          bg-background border-r border-border
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 顶部Logo区域 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <span className="text-lg md:text-xl font-semibold text-foreground truncate">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        {/* 响应式导航菜单 */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.labelKey}
                href={item.href}
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
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setOpen(false);
                  }
                }}
              >
                <item.icon className="
                  h-5 w-5 mr-3 
                  transition-colors
                  text-muted-foreground
                  group-hover:text-foreground
                " />
                <span className="font-medium truncate">
                  {intl.formatMessage({ id: item.labelKey })}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* 响应式遮罩层 - 仅在移动端且侧边栏打开时显示 */}
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