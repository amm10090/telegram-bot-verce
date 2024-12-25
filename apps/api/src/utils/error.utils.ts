export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '验证错误') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class TelegramError extends AppError {
  constructor(message: string = 'Telegram API错误') {
    super(message, 500);
    this.name = 'TelegramError';
  }
}

// 错误处理工具函数
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function handleError(error: Error): void {
  // 这里可以添加错误处理逻辑，比如发送错误通知、记录日志等
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });
}
