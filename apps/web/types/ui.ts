// src/types/ui.ts
import { ReactNode } from 'react'

export interface CommonProps {
  children?: ReactNode
  className?: string
}

export interface CardProps extends CommonProps {
  // 卡片特有的属性
}

export interface BadgeProps extends CommonProps {
  variant?: 'default' | 'destructive'
}

export interface ScrollAreaProps extends CommonProps {
  // 滚动区域特有的属性
}