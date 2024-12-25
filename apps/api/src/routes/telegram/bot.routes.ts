import { Router } from 'express';
import { botController } from '../../controllers/telegram/bot.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createBotValidation,
  updateBotValidation,
  validateWebhookConfig
} from '../../validations/bot.validation';

const router = Router();

// Bot管理路由
router.post('/', validate(createBotValidation), botController.createBot);
router.put('/:id', validate(updateBotValidation), botController.updateBot);
router.delete('/:id', botController.deleteBot);
router.get('/', botController.getBots);
router.get('/:id', botController.getBot);

// Token验证路由
router.post('/validate', botController.validateToken);

// Webhook管理路由
router.post('/:id/webhook', validate(validateWebhookConfig), botController.setWebhook);
router.delete('/:id/webhook', botController.deleteWebhook);

export const botRoutes = router; 