// apps/server/src/index.ts

import express from 'express';
import cors from 'cors';
import telegramRoutes from './app/bot/telegram/routes';

// 创建 Express 应用实例
const app = express();

// 定义服务器端口，优先使用环境变量中的端口，否则使用 3001
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors());                 // 启用 CORS
app.use(express.json());         // 解析 JSON 请求体

// 注册 Telegram 相关路由
app.use('/api/bot/telegram', telegramRoutes);

// 添加基础的错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        ok: false,
        description: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
    console.log(`Telegram Bot API 可以通过 http://localhost:${PORT}/api/bot/telegram 访问`);
});

// 处理未捕获的错误
process.on('unhandledRejection', (error: Error) => {
    console.error('未捕获的异步错误:', error);
});

process.on('uncaughtException', (error: Error) => {
    console.error('未捕获的同步错误:', error);
    process.exit(1);  // 发生严重错误时退出进程
});
// 在 src/index.ts 中添加一个测试路由
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});