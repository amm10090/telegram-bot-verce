import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize } = winston.format;

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// 创建 Winston logger 实例
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), logFormat),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
    // 文件输出
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 在非生产环境下，添加更详细的日志
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

// 导出一个用于 HTTP 请求日志的流
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
