import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { cronBasicAuth } from '../middleware/basicAuth.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { TaskReminderLogRepository } from '../repositories/TaskReminderLogRepository.js';
import { TaskService } from '../services/TaskService.js';
import { TaskController } from '../controllers/TaskController.js';

const router = Router({ mergeParams: true });

const taskRepository = new TaskRepository();
const reminderLogRepository = new TaskReminderLogRepository();
const taskService = new TaskService(taskRepository, reminderLogRepository);
const taskController = new TaskController(taskService);

// Quote scoped routes
router.get('/quotes/:quoteId/tasks', authenticateToken, taskController.listTasks.bind(taskController));
router.post('/quotes/:quoteId/tasks', authenticateToken, taskController.createTask.bind(taskController));
router.get('/quotes/:quoteId/tasks/summary', authenticateToken, taskController.getQuoteTaskSummary.bind(taskController));

// Task scoped routes
router.get('/tasks/:taskId', authenticateToken, taskController.getTaskById.bind(taskController));
router.put('/tasks/:taskId', authenticateToken, taskController.updateTask.bind(taskController));
router.delete('/tasks/:taskId', authenticateToken, taskController.deleteTask.bind(taskController));
router.post('/tasks/:taskId/reminder', authenticateToken, taskController.triggerReminder.bind(taskController));
router.get('/tasks/:taskId/reminders', authenticateToken, taskController.listReminderLogs.bind(taskController));

// Cron routes
router.post('/reminders/run', cronBasicAuth, taskController.runReminderJob.bind(taskController));

export default router;

