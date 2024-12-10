# main.py
from fastapi import FastAPI, Request
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import os
import logging

# 配置日志
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(title="Telegram Bot API")

# 从环境变量获取 Telegram Bot Token
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("未设置 TELEGRAM_BOT_TOKEN 环境变量")

# 定义菜单按钮
MENU_KEYBOARD = [
    ["📚 使用帮助", "ℹ️ 关于我们"],
    ["🔍 搜索", "⚙️ 设置"]
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """处理 /start 命令"""
    try:
        # 创建自定义键盘
        reply_markup = ReplyKeyboardMarkup(
            MENU_KEYBOARD,
            resize_keyboard=True
        )
        
        # 欢迎消息
        welcome_message = (
            "👋 欢迎使用我们的机器人！\n\n"
            "请选择以下功能：\n"
            "📚 使用帮助 - 获取详细使用指南\n"
            "ℹ️ 关于我们 - 了解更多信息\n"
            "🔍 搜索 - 使用搜索功能\n"
            "⚙️ 设置 - 个性化设置"
        )
        
        # 发送欢迎消息
        await update.message.reply_text(
            welcome_message,
            reply_markup=reply_markup
        )
        logger.info(f"用户 {update.effective_user.id} 启动了机器人")
        
    except Exception as e:
        logger.error(f"处理 /start 命令时出错: {str(e)}")
        await update.message.reply_text("抱歉，发生了一个错误。请稍后重试。")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """处理 /help 命令"""
    help_text = (
        "🔍 帮助信息：\n\n"
        "1. /start - 启动机器人\n"
        "2. /help - 显示此帮助信息\n"
        "3. 点击菜单按钮使用其他功能"
    )
    await update.message.reply_text(help_text)
    logger.info(f"用户 {update.effective_user.id} 请求了帮助信息")

async def setup_bot():
    """配置和启动机器人"""
    try:
        # 创建机器人应用实例
        bot = Application.builder().token(TOKEN).build()
        
        # 注册命令处理器
        bot.add_handler(CommandHandler("start", start))
        bot.add_handler(CommandHandler("help", help_command))
        
        logger.info("机器人设置完成")
        return bot
        
    except Exception as e:
        logger.error(f"设置机器人时出错: {str(e)}")
        raise

@app.get("/")
async def root():
    """健康检查端点"""
    return {"status": "运行正常", "message": "Telegram Bot 服务已启动"}

@app.post("/webhook")
async def webhook(request: Request):
    """处理 Telegram webhook 请求"""
    try:
        # 初始化机器人
        bot = await setup_bot()
        
        # 获取更新信息
        update_data = await request.json()
        logger.info(f"收到webhook更新: {update_data}")
        
        # 处理更新
        update = Update.de_json(update_data, bot.bot)
        await bot.process_update(update)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"处理webhook请求时出错: {str(e)}")
        return {"status": "error", "detail": str(e)}

# 在开发环境中运行
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

