import { NextResponse } from "next/server";
import { ApiResponse, Bot } from "@/types/bot";

// 模拟数据，实际应用中应该从数据库获取
const mockBots: Bot[] = [
  {
    id: "1",
    name: "Welcome Bot",
    apiKey: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    isEnabled: true,
    status: "active",
    createdAt: new Date().toISOString(),
    description: "A bot to welcome new members"
  },
  {
    id: "2",
    name: "Support Bot",
    apiKey: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew22",
    isEnabled: false,
    status: "inactive",
    createdAt: new Date().toISOString(),
    description: "A bot to handle support requests"
  }
];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const botIndex = mockBots.findIndex(bot => bot.id === params.id);
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