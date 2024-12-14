// utils/validation.js
import { logger } from '../services/logger';
import { ValidationError } from '../types.js';

class ValidationUtil {
    constructor() {
        // 预定义的验证规则
        this.rules = {
            // 用户ID验证
            userId: (value) => {
                if (!value || typeof value !== 'number') {
                    throw new ValidationError('用户ID必须是数字');
                }
                return true;
            },

            // 消息文本验证
            messageText: (value, maxLength = 4096) => {
                if (!value || typeof value !== 'string') {
                    throw new ValidationError('消息文本必须是字符串');
                }
                if (value.length > maxLength) {
                    throw new ValidationError(`消息文本长度不能超过${maxLength}字符`);
                }
                return true;
            },

            // 命令格式验证
            command: (value) => {
                if (!value || typeof value !== 'string') {
                    throw new ValidationError('命令必须是字符串');
                }
                if (!value.startsWith('/')) {
                    throw new ValidationError('命令必须以/开头');
                }
                if (value.length > 32) {
                    throw new ValidationError('命令长度不能超过32字符');
                }
                return true;
            },

            // 日期格式验证
            date: (value) => {
                if (!value) {
                    throw new ValidationError('日期不能为空');
                }
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new ValidationError('无效的日期格式');
                }
                return true;
            },

            // 数值范围验证
            numberRange: (value, min, max) => {
                if (typeof value !== 'number') {
                    throw new ValidationError('必须是数字');
                }
                if (value < min || value > max) {
                    throw new ValidationError(`数值必须在${min}到${max}之间`);
                }
                return true;
            }
        };
    }

    // 验证单个字段
    validateField(fieldName, value, rules) {
        try {
            // 如果规则是函数，直接执行
            if (typeof rules === 'function') {
                return rules(value);
            }

            // 如果规则是预定义规则的名称
            if (typeof rules === 'string' && this.rules[rules]) {
                return this.rules[rules](value);
            }

            // 如果规则是对象，处理多个验证条件
            if (typeof rules === 'object') {
                Object.entries(rules).forEach(([ruleName, ruleConfig]) => {
                    if (this.rules[ruleName]) {
                        this.rules[ruleName](value, ...ruleConfig);
                    }
                });
                return true;
            }

            throw new ValidationError(`未知的验证规则: ${rules}`);
        } catch (error) {
            if (error instanceof ValidationError) {
                error.field = fieldName;
            }
            throw error;
        }
    }

    // 验证对象的多个字段
    validateObject(obj, schema) {
        const errors = [];

        Object.entries(schema).forEach(([field, rules]) => {
            try {
                this.validateField(field, obj[field], rules);
            } catch (error) {
                errors.push(error);
            }
        });

        if (errors.length > 0) {
            logger.warn('数据验证失败', { errors });
            throw new ValidationError('数据验证失败', errors);
        }

        return true;
    }

    // 添加自定义验证规则
    addRule(ruleName, ruleFunction) {
        if (typeof ruleFunction !== 'function') {
            throw new ValidationError('验证规则必须是函数');
        }
        this.rules[ruleName] = ruleFunction;
        logger.info(`添加新的验证规则: ${ruleName}`);
    }

    // 检查必填字段
    validateRequired(obj, requiredFields) {
        const missingFields = requiredFields.filter(field => {
            const value = obj[field];
            return value === undefined || value === null || value === '';
        });

        if (missingFields.length > 0) {
            throw new ValidationError(
                `缺少必填字段: ${missingFields.join(', ')}`,
                missingFields
            );
        }

        return true;
    }

    // 清理对象数据
    sanitizeObject(obj, allowedFields) {
        const sanitized = {};

        allowedFields.forEach(field => {
            if (obj.hasOwnProperty(field)) {
                // 基本的XSS防护
                if (typeof obj[field] === 'string') {
                    sanitized[field] = this.escapeHtml(obj[field]);
                } else {
                    sanitized[field] = obj[field];
                }
            }
        });

        return sanitized;
    }

    // HTML转义(用于防止XSS攻击)
    escapeHtml(str) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
    }
}

// 导出验证工具实例
export const validationUtil = new ValidationUtil();