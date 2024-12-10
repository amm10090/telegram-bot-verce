from fastapi import FastAPI, Request
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import os
import logging
import json

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Telegram Bot API")
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("未设置 TELEGRAM_BOT_TOKEN 环境变量")

bot_app = Application.builder().token(TOKEN).build()

MENU_KEYBOARD = [
    ["📚 使用帮助", "ℹ️ 关于我们"],
    ["🔍 搜索", "⚙️ 设置"]
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        logger.info(f"开始处理 /start 命令，用户 ID: {update.effective_user.id}")
        reply_markup = ReplyKeyboardMarkup(
            MENU_KEYBOARD,
            resize_keyboard=True
        )
        welcome_message = (
            "👋 欢迎使用我们的机器人！\n\n"
            "请选择以下功能：\n"
            "📚 使用帮助 - 获取详细使用指南\n"
            "ℹ️ 关于我们 - 了解更多信息\n"
            "🔍 搜索 - 使用搜索功能\n"
            "⚙️ 设置 - 个性化设置"
        )
        await update.message.reply_text(
            welcome_message,
            reply_markup=reply_markup
        )
        logger.info("成功发送欢迎消息")
    except Exception as e:
        logger.error(f"处理 /start 命令时出错: {str(e)}")
        await update.message.reply_text("抱歉，发生了一个错误。请稍后重试。")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        help_text = (
            "🔍 帮助信息：\n\n"
            "1. /start - 启动机器人\n"
            "2. /help - 显示此帮助信息\n"
            "3. 点击菜单按钮使用其他功能"
        )
        await update.message.reply_text(help_text)
        logger.info(f"用户 {update.effective_user.id} 请求了帮助信息")
    except Exception as e:
        logger.error(f"处理 /help 命令时出错: {str(e)}")
        await update.message.reply_text("抱歉，发生了一个错误。请稍后重试。")

async def about_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        about_text = (
            "ℹ️ 关于我们：\n\n"
            "这是一个功能丰富的 Telegram 机器人，"
            "我们致力于为用户提供最好的服务体验。\n\n"
            "版本：1.0.0\n"
            "开发者：@YourUsername"
        )
        await update.message.reply_text(about_text)
        logger.info(f"用户 {update.effective_user.id} 查看了关于信息")
    except Exception as e:
        logger.error(f"处理 /about 命令时出错: {str(e)}")
        await update.message.reply_text("抱歉，发生了一个错误。请稍后重试。")

bot_app.add_handler(CommandHandler("start", start))
bot_app.add_handler(CommandHandler("help", help_command))
bot_app.add_handler(CommandHandler("about", about_command))

@app.get("/")
async def root():
    return {"status": "运行正常", "message": "Telegram Bot 服务已启动"}

@app.post("/webhook")
async def webhook(request: Request):
    try:
        update_data = await request.json()
        logger.info(f"收到 webhook 请求: {json.dumps(update_data, ensure_ascii=False)}")
        update = Update.de_json(update_data, bot_app.bot)
        await bot_app.process_update(update)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"处理 webhook 请求时出错: {str(e)}")
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)