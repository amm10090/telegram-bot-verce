// api/bot.js
import { Telegraf } from 'telegraf';
import { logger } from './services/logger.js';
import { MAIN_KEYBOARD } from './config/keyboards.js';
import { BotError } from './types.js';

class BotCore {
    constructor() {
        this.bot = null;
        this.initialized = false;
        this.commandHandlers = new Map();
    }

    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            this.bot = new Telegraf(process.env.BOT_TOKEN);
            await this.setupMiddleware();
            await this.setupBasicCommands();
            this.initialized = true;

            logger.info('Bot 核心初始化成功');
        } catch (error) {
            logger.error('Bot 核心初始化失败', error);
            throw error;
        }
    }

    async setupMiddleware() {
        this.bot.use(async (ctx, next) => {
            const start = Date.now();
            await next();
            const ms = Date.now() - start;
            logger.info('处理时间', { ms, chatId: ctx.chat?.id });
        });
    }

    async setupBasicCommands() {
        this.bot.command('start', async (ctx) => {
            try {
                const welcomeMessage = `
👋 欢迎使用我们的服务！

请使用下方菜单选择需要的功能。`;
                await ctx.reply(welcomeMessage, MAIN_KEYBOARD);
            } catch (error) {
                logger.error('处理 start 命令出错', error);
                throw error;
            }
        });
    }

    async handleUpdate(update) {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.bot.handleUpdate(update);
    }

    registerCommand(command, handler) {
        this.commandHandlers.set(command, handler);
        this.bot.command(command, handler);
    }

    async sendMessage(chatId, text, extra = {}) {
        try {
            return await this.bot.telegram.sendMessage(chatId, text, extra);
        } catch (error) {
            logger.error('发送消息失败', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.bot) {
                await this.bot.stop();
                this.initialized = false;
                logger.info('Bot 清理完成');
            }
        } catch (error) {
            logger.error('Bot 清理失败', error);
            throw error;
        }
    }
}

export const botCore = new BotCore();