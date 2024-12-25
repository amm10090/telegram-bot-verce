import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export class ResponseUtils {
  static success<T>(res: Response, data?: T, message: string = '操作成功'): Response {
    return res.status(200).json({
      success: true,
      data,
      message
    });
  }

  static created<T>(res: Response, data?: T, message: string = '创建成功'): Response {
    return res.status(201).json({
      success: true,
      data,
      message
    });
  }

  static badRequest(res: Response, message: string = '请求参数错误', error?: any): Response {
    return res.status(400).json({
      success: false,
      message,
      error
    });
  }

  static unauthorized(res: Response, message: string = '未授权访问', error?: any): Response {
    return res.status(401).json({
      success: false,
      message,
      error
    });
  }

  static forbidden(res: Response, message: string = '禁止访问', error?: any): Response {
    return res.status(403).json({
      success: false,
      message,
      error
    });
  }

  static notFound(res: Response, message: string = '资源未找到', error?: any): Response {
    return res.status(404).json({
      success: false,
      message,
      error
    });
  }

  static conflict(res: Response, message: string = '资源冲突', error?: any): Response {
    return res.status(409).json({
      success: false,
      message,
      error
    });
  }

  static internalError(res: Response, message: string = '服务器内部错误', error?: any): Response {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'production' ? undefined : error
    });
  }
} 