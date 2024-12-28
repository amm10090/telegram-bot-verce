import { NextResponse } from "next/server";
import { z } from "zod";
import { TelegramClient } from "@lib/telegram";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// 验证菜单项数据结构
const menuItemSchema = z.object({
  text: z.string().min(1, "菜单文本不能为空"),
  command: z.string().optional(),
  url: z.string().url("请输入有效的URL").optional().or(z.literal('')),
});

const menuSchema = z.array(menuItemSchema);

// 确保菜单表结构存在
async function ensureMenuStructure(botId: string) {
  try {
    // 检查是否已存在菜单
    const existingMenuItems = await prisma.botMenu.findMany({
      where: { botId },
    });

    // 如果不存在菜单项，创建默认菜单
    if (existingMenuItems.length === 0) {
      await prisma.botMenu.create({
        data: {
          botId,
          text: "开始",
          command: "/start",
          order: 0,
        }
      });
    }
  } catch (error) {
    console.error("创建菜单结构失败:", error);
    throw error;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;

    // 确保菜单结构存在
    await ensureMenuStructure(botId);

    // 获取菜单数据
    const menuItems = await prisma.botMenu.findMany({
      where: { botId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        text: true,
        command: true,
        url: true,
        order: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error("获取菜单失败:", error);
    return NextResponse.json(
      { success: false, message: "获取菜单失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;
    const body = await req.json();
    
    // 验证请求数据
    const validatedMenu = menuSchema.parse(body.menu);

    // 开启事务处理
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 删除旧菜单
      await tx.botMenu.deleteMany({
        where: { botId }
      });

      // 创建新菜单
      const menuItems = validatedMenu.map((item, index) => ({
        ...item,
        botId,
        order: index,
      }));

      await tx.botMenu.createMany({
        data: menuItems
      });
    });

    return NextResponse.json({
      success: true,
      message: "菜单更新成功"
    });
  } catch (error) {
    console.error("更新菜单失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "菜单数据格式错误", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新菜单失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;
    const body = await req.json();
    
    // 验证排序数据
    const orderUpdates = z.array(z.object({
      id: z.string(),
      order: z.number().int().min(0)
    })).parse(body.orders);

    // 批量更新排序
    await Promise.all(
      orderUpdates.map(update =>
        prisma.botMenu.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "菜单排序更新成功"
    });
  } catch (error) {
    console.error("更新菜单排序失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "排序数据格式错误", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新菜单排序失败" },
      { status: 500 }
    );
  }
} 