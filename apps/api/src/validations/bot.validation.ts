import { body } from 'express-validator';
import { Bot } from '../models/bot.model';

export const createBotValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Bot名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('Bot名称长度必须在2-50个字符之间'),

  body('token')
    .trim()
    .notEmpty()
    .withMessage('Bot Token不能为空')
    .matches(/^\d+:[A-Za-z0-9_-]+$/)
    .withMessage('无效的Bot Token格式')
    .custom(async (token) => {
      const existingBot = await Bot.findOne({ token });
      if (existingBot) {
        throw new Error('该Bot Token已被使用');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),

  body('settings').optional().isObject().withMessage('settings必须是一个对象'),

  body('settings.allowGroups')
    .optional()
    .isBoolean()
    .withMessage('allowGroups必须是布尔值'),

  body('settings.allowChannels')
    .optional()
    .isBoolean()
    .withMessage('allowChannels必须是布尔值'),

  body('settings.commandPrefix')
    .optional()
    .trim()
    .isLength({ max: 5 })
    .withMessage('命令前缀不能超过5个字符'),

  body('settings.customCommands')
    .optional()
    .isArray()
    .withMessage('customCommands必须是一个数组'),

  body('settings.customCommands.*.command')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('命令名称不能为空')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('命令只能包含字母、数字和下划线'),

  body('settings.customCommands.*.description')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('命令描述不能超过100个字符'),

  body('settings.customCommands.*.response')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('命令响应不能为空')
    .isLength({ max: 1000 })
    .withMessage('命令响应不能超过1000个字符'),
];

export const updateBotValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Bot名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('Bot名称长度必须在2-50个字符之间'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),

  body('isEnabled').optional().isBoolean().withMessage('isEnabled必须是布尔值'),

  body('settings').optional().isObject().withMessage('settings必须是一个对象'),

  // 复用settings相关的验证规则
  ...createBotValidation.filter(
    (validation) =>
      (validation as any).fields &&
      (validation as any).fields[0].startsWith('settings.')
  ),
];

export const validateWebhookConfig = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Webhook URL不能为空')
    .isURL()
    .withMessage('无效的URL格式'),

  body('certificate').optional().isString().withMessage('证书必须是字符串格式'),

  body('maxConnections')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('最大连接数必须在1-100之间'),

  body('allowedUpdates')
    .optional()
    .isArray()
    .withMessage('allowedUpdates必须是一个数组')
    .custom((value) => {
      const validUpdates = [
        'message',
        'edited_message',
        'channel_post',
        'edited_channel_post',
        'inline_query',
        'chosen_inline_result',
        'callback_query',
        'shipping_query',
        'pre_checkout_query',
        'poll',
        'poll_answer',
      ];

      if (!value.every((update: string) => validUpdates.includes(update))) {
        throw new Error('包含��效的更新类型');
      }
      return true;
    }),
];
