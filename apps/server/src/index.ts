// apps/server/src/index.ts

// 导入必要的模块和类型
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import telegramRoutes from './app/bot/telegram/routes';

// 创建 Express 应用实例
const app = express();

// 配置全局中间件
// 启用 CORS，允许跨域请求
app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());

// 添加请求日志中间件，记录所有请求
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查路由
// 用于验证服务是否正常运行
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 注册 Telegram bot 相关路由
// 所有 /api/bot/telegram 开头的请求都会被转发到 telegramRoutes 处理
app.use('/api/bot/telegram', telegramRoutes);

// 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('全局错误:', err);
    res.status(500).json({
        ok: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});

// 环境变量配置
const port = process.env.PORT || 3001;

// 根据运行环境决定导出方式
if (process.env.VERCEL) {
    // Vercel 环境下导出 app 实例
    // 这是 Vercel Serverless 函数的要求
    module.exports = app;
} else {
    // 本地开发环境启动 HTTP 服务器
    app.listen(port, () => {
        console.log(`服务器已启动: http://localhost:${port}`);
        console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
}

// 为了支持 TypeScript 的导出语法
export default app;