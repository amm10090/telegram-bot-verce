// src/hooks/useRoutePreload.ts
import { useCallback } from 'react';

// 定义路由组件的预加载映射
const routeComponentMap = {
    // 路由路径与组件导入函数的映射关系
    '/': () => import('../app/dashboard/page'),
    '/bots': () => import('../app/bots/page'),
    '/settings': () => import('../app/settings/page'),
};

export function useRoutePreload() {
    // 预加载指定路由的组件
    const preloadRoute = useCallback((path: keyof typeof routeComponentMap) => {
        const importFn = routeComponentMap[path];
        if (importFn) {
            // 开始预加载，并在控制台记录状态
            importFn()
                .then(() => {
                    console.debug(`路由组件预加载成功: ${path}`);
                })
                .catch((error) => {
                    console.error(`路由组件预加载失败 ${path}:`, error);
                });
        }
    }, []);

    // 预加载所有路由组件
    const preloadAllRoutes = useCallback(() => {
        Object.keys(routeComponentMap).forEach((path) => {
            preloadRoute(path as keyof typeof routeComponentMap);
        });
    }, [preloadRoute]);

    return {
        preloadRoute,
        preloadAllRoutes,
    };
}