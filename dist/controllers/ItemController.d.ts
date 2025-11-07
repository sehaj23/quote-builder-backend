import { Request, Response } from 'express';
import { ItemService } from '../services/ItemService.js';
export declare class ItemController {
    private itemService;
    constructor(itemService: ItemService);
    getItemsByCompany(req: Request, res: Response): Promise<void>;
    getItemById(req: Request, res: Response): Promise<void>;
    createItem(req: Request, res: Response): Promise<void>;
    updateItem(req: Request, res: Response): Promise<void>;
    deleteItem(req: Request, res: Response): Promise<void>;
    searchItems(req: Request, res: Response): Promise<void>;
    getItemsByCategory(req: Request, res: Response): Promise<void>;
    getCategories(req: Request, res: Response): Promise<void>;
    getMyCategories(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ItemController.d.ts.map