import { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'destructive'
  children: ReactNode
}

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}