import express from 'express';
import cors from 'cors';
import telegramRoutes from './app/bot/telegram/routes';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 健康检查路由
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Telegram bot 路由
app.use('/api/bot/telegram', telegramRoutes);

// Vercel 环境检测
const port = process.env.PORT || 3001;
if (process.env.VERCEL) {
    // Vercel 环境下导出 app
    module.exports = app;
} else {
    // 本地环境启动服务器
    app.listen(port, () => {
        console.log(`服务器运行在端口 ${port}`);
    });
}