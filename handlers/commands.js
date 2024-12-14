// handlers/commands.js
import { logger } from '../services/logger.js';
import { statisticsService } from '../services/statistics.js';
import { MessageType, ValidationError } from '../api/types.js';

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.setupBaseCommands();
    }

    setupBaseCommands() {
        this.registerCommand('help', this.handleHelp);
        this.registerCommand('stats', this.handleStats);
        this.registerCommand('status', this.handleStatus);
    }

    registerCommand(command, handler) {
        if (typeof handler !== 'function') {
            throw new ValidationError('命令处理器必须是函数');
        }
        this.commands.set(command, handler);
        logger.info(`注册新命令: ${command}`);
    }

    async handleCommand(ctx) {
        try {
            const text = ctx.message.text;
            const commandName = text.split(' ')[0].substring(1).toLowerCase();

            const handler = this.commands.get(commandName);

            if (!handler) {
                await ctx.reply('未知命令。使用 /help 查看可用命令列表。');
                return;
            }

            statisticsService.recordMessage(ctx.message, ctx.from.id, MessageType.COMMAND);

            await handler.call(this, ctx);

        } catch (error) {
            logger.error('命令处理错误', {
                command: ctx.message.text,
                error: error.message
            });
            throw error;
        }
    }

    async handleHelp(ctx) {
        const helpText = `
可用命令列表：

/help - 显示此帮助信息
/stats - 显示使用统计
/status - 显示系统状态

使用这些命令来与机器人交互。`;

        await ctx.reply(helpText);
    }

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

    getCommands() {
        return Array.from(this.commands.keys());
    }

    removeCommand(command) {
        if (this.commands.delete(command)) {
            logger.info(`移除命令: ${command}`);
            return true;
        }
        return false;
    }
}

const commandHandler = new CommandHandler();
export { commandHandler };