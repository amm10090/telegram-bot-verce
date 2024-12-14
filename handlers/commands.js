// handlers/commands.js
import { logger } from '../services/logger';
import { statisticsService } from '../services/statistics';
import { MessageType, ValidationError } from '../core/types';

class CommandHandler {
    constructor() {
        // 初始化命令映射
        this.commands = new Map();
        // 设置基础命令
        this.setupBaseCommands();
    }

    // 设置基础命令
    setupBaseCommands() {
        this.registerCommand('help', this.handleHelp);
        this.registerCommand('stats', this.handleStats);
        this.registerCommand('status', this.handleStatus);
    }

    // 注册新命令
    registerCommand(command, handler) {
        if (typeof handler !== 'function') {
            throw new ValidationError('命令处理器必须是函数');
        }
        this.commands.set(command, handler);
        logger.info(`注册新命令: ${command}`);
    }

    // 处理命令
    async handleCommand(ctx) {
        try {
            // 获取命令名称
            const text = ctx.message.text;
            const commandName = text.split(' ')[0].substring(1).toLowerCase();

            // 查找命令处理器
            const handler = this.commands.get(commandName);

            if (!handler) {
                await ctx.reply('未知命令。使用 /help 查看可用命令列表。');
                return;
            }

            // 记录命令使用
            statisticsService.recordMessage(ctx.message, ctx.from.id, MessageType.COMMAND);

            // 执行命令处理器
            await handler.call(this, ctx);

        } catch (error) {
            logger.error('命令处理错误', {
                command: ctx.message.text,
                error: error.message
            });
            throw error;
        }
    }

    // 帮助命令处理器
    async handleHelp(ctx) {
        const helpText = `
可用命令列表：

/help - 显示此帮助信息
/stats - 显示使用统计
/status - 显示系统状态

使用这些命令来与机器人交互。`;

        await ctx.reply(helpText);
    }

    // 统计命令处理器
    async handleStats(ctx) {
        try {
            const stats = await statisticsService.getDailyStats();

            const statsMessage = `
📊 今日统计：

总消息数：${stats.总消息数}
命令使用：${stats.命令使用数}
活跃用户：${stats.活跃用户数}

消息类型分布：
${Object.entries(stats.消息类型分布)
                    .map(([type, count]) => `${type}: ${count}`)
                    .join('\n')}`;

            await ctx.reply(statsMessage);
        } catch (error) {
            logger.error('获取统计信息失败', error);
            throw error;
        }
    }

    // 状态命令处理器
    async handleStatus(ctx) {
        try {
            const uptime = process.uptime();
            const memory = process.memoryUsage();

            const statusMessage = `
🤖 系统状态：

运行时间：${Math.floor(uptime / 3600)}小时${Math.floor((uptime % 3600) / 60)}分钟
内存使用：${Math.round(memory.heapUsed / 1024 / 1024)}MB
系统负载：${Math.round((memory.heapUsed / memory.heapTotal) * 100)}%

服务状态：正常运行中`;

            await ctx.reply(statusMessage);
        } catch (error) {
            logger.error('获取系统状态失败', error);
            throw error;
        }
    }

    // 获取所有可用命令
    getCommands() {
        return Array.from(this.commands.keys());
    }

    // 移除命令
    removeCommand(command) {
        if (this.commands.delete(command)) {
            logger.info(`移除命令: ${command}`);
            return true;
        }
        return false;
    }
}

// 创建并导出命令处理器实例
const commandHandler = new CommandHandler();
export { commandHandler };