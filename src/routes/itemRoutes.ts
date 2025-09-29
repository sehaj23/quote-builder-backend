import { Router } from 'express';
import { ItemController } from '@/controllers/ItemController.js';

const router = Router({ mergeParams: true });
const itemController = new ItemController();

// Item routes
// Note: These routes are mounted under /api/companies/:companyId/items and /api/items

// Company-specific item routes (mounted under /api/companies/:companyId/items)
router.get('/search', itemController.searchItems.bind(itemController));  // GET /api/companies/:companyId/items/search?query=...
router.get('/category/:category', itemController.getItemsByCategory.bind(itemController));  // GET /api/companies/:companyId/items/category/:category
router.get('/', itemController.getItemsByCompany.bind(itemController));  // GET /api/companies/:companyId/items
router.post('/', itemController.createItem.bind(itemController));  // POST /api/companies/:companyId/items

// Individual item routes (mounted under /api/items)
export const individualItemRouter = Router();
individualItemRouter.get('/:id', itemController.getItemById.bind(itemController));  // GET /api/items/:id
individualItemRouter.put('/:id', itemController.updateItem.bind(itemController));  // PUT /api/items/:id
individualItemRouter.delete('/:id', itemController.deleteItem.bind(itemController));  // DELETE /api/items/:id

// Category routes (mounted under /api/companies/:companyId/categories)
export const categoryRouter = Router({ mergeParams: true });
categoryRouter.get('/', itemController.getCategories.bind(itemController));  // GET /api/companies/:companyId/categories

export default router;