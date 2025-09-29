import { Router } from 'express';
import { ItemController } from '@/controllers/ItemController.js';
const router = Router();
const itemController = new ItemController();
router.get('/search', itemController.searchItems);
router.get('/category/:category', itemController.getItemsByCategory);
router.get('/', itemController.getItemsByCompany);
router.post('/', itemController.createItem);
export const individualItemRouter = Router();
individualItemRouter.get('/:id', itemController.getItemById);
individualItemRouter.put('/:id', itemController.updateItem);
individualItemRouter.delete('/:id', itemController.deleteItem);
export const categoryRouter = Router();
categoryRouter.get('/', itemController.getCategories);
export default router;
//# sourceMappingURL=itemRoutes.js.map