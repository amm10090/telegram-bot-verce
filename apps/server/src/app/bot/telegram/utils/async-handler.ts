// apps/server/src/app/bot/telegram/utils/async-handler.ts

import { ExtendedRequest, ExtendedResponse, NextFunction } from '../types';

type AsyncRequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => Promise<void>;

/**
 * 异步处理器工具类
 * 统一处理异步操作中的错误
 */
export const handleAsync = (handler: AsyncRequestHandler) => {
    return async (req: ExtendedRequest, res: ExtendedResponse, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};