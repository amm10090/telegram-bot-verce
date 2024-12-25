import { Request, Response, NextFunction } from 'express';
import {
  validationResult,
  ValidationChain,
  param,
  query,
} from 'express-validator';
import { ResponseUtils } from '../utils/response.utils';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 执行所有验证
    await Promise.all(validations.map((validation) => validation.run(req)));

    // 获取验证结果
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 格式化错误信息
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    // 返回验证错误响应
    return ResponseUtils.badRequest(res, '请求参数验证失败', formattedErrors);
  };
};

// 通用的分页参数验证
export const validatePagination = [
  // 页码验证
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),

  // 每页数量验证
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
    .toInt(),

  // 排序字段验证
  query('sortBy').optional().isString().withMessage('排序字段必须是字符串'),

  // 排序方向验证
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是 asc 或 desc'),
];

// 通用的ID参数验证
export const validateId = [param('id').isMongoId().withMessage('无效的ID格式')];

// 通用的搜索参数验证
export const validateSearch = [
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('搜索关键词不能为空'),
];
