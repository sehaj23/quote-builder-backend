import { Router } from 'express';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { TaskReminderLogRepository } from '../repositories/TaskReminderLogRepository.js';
import { TaskService } from '../services/TaskService.js';
import { WebhookController } from '../controllers/WebhookController.js';

const router = Router();

const taskRepository = new TaskRepository();
const reminderLogRepository = new TaskReminderLogRepository();
const taskService = new TaskService(taskRepository, reminderLogRepository);
const webhookController = new WebhookController(taskService);

router.post('/pinpoint', webhookController.handlePinpointEvent.bind(webhookController));

export default router;

