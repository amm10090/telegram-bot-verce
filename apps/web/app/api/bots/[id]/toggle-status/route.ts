import { NextResponse } from "next/server";
import { ApiResponse, IBot } from "@/types/bot";
import { Types } from "mongoose";

// 模拟数据，实际应用中应该从数据库获取
const mockBots: Partial<IBot>[] = [
  {
    name: "Welcome Bot",
    token: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    apiKey: "bot_abc123",
    isEnabled: true,
    status: "active",
    userId: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Support Bot",
    token: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew22",
    apiKey: "bot_def456",
    isEnabled: false,
    status: "inactive",
    userId: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const botIndex = mockBots.findIndex((bot, index) => index === parseInt(params.id) - 1);
    if (botIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Bot not found"
        },
        { status: 404 }
      );
    }

    const bot = mockBots[botIndex];
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: "Bot not found"
        },
        { status: 404 }
      );
    }

    // 切换状态
    const currentStatus = bot.status;
    bot.status = currentStatus === "active" ? "inactive" : "active";
    bot.isEnabled = bot.status === "active";

    return NextResponse.json({
      success: true,
      data: bot
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to toggle bot status",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 