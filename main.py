# main.py
from fastapi import FastAPI, Request
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
)
import os

# 创建 FastAPI 应用
app = FastAPI()

# 从环境变量获取 Telegram Bot Token
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "your-bot-token")

# 创建菜单按钮
MENU_KEYBOARD = [
    ["📚 帮助", "ℹ️ 关于"],
    ["🔍 搜索", "⚙️ 设置"]
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """处理 /start 命令"""
    reply_markup = ReplyKeyboardMarkup(
        MENU_KEYBOARD,
        resize_keyboard=True
    )
    welcome_message = (
        "👋 欢迎使用机器人!\n\n"
        "请选择以下选项：\n"
        "📚 帮助 - 获取使用指南\n"
        "ℹ️ 关于 - 了解机器人信息\n"
        "🔍 搜索 - 搜索功能\n"
        "⚙️ 设置 - 配置机器人"
    )
    await update.message.reply_text(
        welcome_message,
        reply_markup=reply_markup
    )

async def setup_bot():
    """配置和启动机器人"""
    bot = Application.builder().token(TOKEN).build()
    
    # 注册命令处理器
    bot.add_handler(CommandHandler("start", start))
    
    return bot

@app.post("/webhook")
async def webhook(request: Request):
    """处理 Telegram webhook 请求"""
    bot = await setup_bot()
    
    # 获取更新信息
    update_data = await request.json()
    update = Update.de_json(update_data, bot.bot)
    
    # 处理更新
    await bot.process_update(update)
    
    return {"status": "ok"}
