import { Router } from 'express';
import { ItemController } from '@/controllers/ItemController.js';
import { ItemService } from '@/services/ItemService.js';
import { ItemRepository } from '@/repositories/ItemRepository.js';
import { authenticateToken } from '@/middleware/auth.js';

const router = Router({ mergeParams: true });

// Dependency injection
const itemRepository = new ItemRepository();
const itemService = new ItemService(itemRepository);
const itemController = new ItemController(itemService);

// Item routes
// Note: These routes are mounted under /api/companies/:companyId/items and /api/items

// Company-specific item routes (mounted under /api/companies/:companyId/items)
router.get('/search', authenticateToken, itemController.searchItems.bind(itemController));  // GET /api/companies/:companyId/items/search?query=...
router.get('/category/:category', authenticateToken, itemController.getItemsByCategory.bind(itemController));  // GET /api/companies/:companyId/items/category/:category
router.get('/', authenticateToken, itemController.getItemsByCompany.bind(itemController));  // GET /api/companies/:companyId/items
router.post('/', authenticateToken, itemController.createItem.bind(itemController));  // POST /api/companies/:companyId/items

// Individual item routes (mounted under /api/items)
export const individualItemRouter = Router();
individualItemRouter.get('/:id', authenticateToken, itemController.getItemById.bind(itemController));  // GET /api/items/:id
individualItemRouter.put('/:id', authenticateToken, itemController.updateItem.bind(itemController));  // PUT /api/items/:id
individualItemRouter.delete('/:id', authenticateToken, itemController.deleteItem.bind(itemController));  // DELETE /api/items/:id

// Category routes (mounted under /api/companies/:companyId/categories)
export const categoryRouter = Router({ mergeParams: true });
categoryRouter.get('/', authenticateToken, itemController.getCategories.bind(itemController));  // GET /api/companies/:companyId/categories

export default router;