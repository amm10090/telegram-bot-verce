import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        "relative w-10 h-10 rounded-md",
        "flex items-center justify-center",
        "transition-colors duration-300",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        // Light mode styles
        "bg-background border border-input",
        "hover:bg-accent",
        // Dark mode styles
        "dark:bg-card dark:border-border",
        "dark:hover:bg-accent"
      )}
      aria-label={theme === 'dark' 
        ? intl.formatMessage({ id: 'theme.light' })
        : intl.formatMessage({ id: 'theme.dark' })
      }
    >
      <div className="relative w-5 h-5">
        {/* Light Mode Icon */}
        <Sun 
          className={cn(
            "absolute top-0 left-0 w-5 h-5",
            "transition-all duration-300 ease-in-out",
            "text-amber-500",
            theme === 'dark'
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          )}
        />
        {/* Dark Mode Icon */}
        <Moon 
          className={cn(
            "absolute top-0 left-0 w-5 h-5",
            "transition-all duration-300 ease-in-out",
            "text-slate-900 dark:text-slate-200",
            theme === 'dark'
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          )}
        />
      </div>
    </button>
  );
}