import { ItemService } from '@/services/ItemService.js';
export class ItemController {
    itemService;
    constructor() {
        this.itemService = new ItemService();
    }
    async getItemsByCompany(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            const items = await this.itemService.getItemsByCompany(companyId);
            res.json({
                success: true,
                data: items,
                message: `Found ${items.length} items for company ${companyId}`
            });
        }
        catch (error) {
            console.error('Error in ItemController.getItemsByCompany:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    async getItemById(req, res) {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid item ID'
                });
                return;
            }
            const item = await this.itemService.getItemById(itemId);
            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }
            res.json({
                success: true,
                data: item,
                message: 'Item retrieved successfully'
            });
        }
        catch (error) {
            console.error('Error in ItemController.getItemById:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    async createItem(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            const itemData = {
                ...req.body,
                company_id: companyId
            };
            const result = await this.itemService.createItem(itemData);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Item created successfully'
            });
        }
        catch (error) {
            console.error('Error in ItemController.createItem:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create item'
            });
        }
    }
    async updateItem(req, res) {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid item ID'
                });
                return;
            }
            const itemData = req.body;
            const updatedItem = await this.itemService.updateItem(itemId, itemData);
            if (!updatedItem) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }
            res.json({
                success: true,
                data: updatedItem,
                message: 'Item updated successfully'
            });
        }
        catch (error) {
            console.error('Error in ItemController.updateItem:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update item'
            });
        }
    }
    async deleteItem(req, res) {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid item ID'
                });
                return;
            }
            const deleted = await this.itemService.deleteItem(itemId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Item not found'
                });
                return;
            }
            res.json({
                success: true,
                data: null,
                message: 'Item deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in ItemController.deleteItem:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete item'
            });
        }
    }
    async searchItems(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            const query = req.query.query;
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            if (!query) {
                res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
                return;
            }
            const items = await this.itemService.searchItems(companyId, query);
            res.json({
                success: true,
                data: items,
                message: `Found ${items.length} items matching "${query}"`
            });
        }
        catch (error) {
            console.error('Error in ItemController.searchItems:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search items'
            });
        }
    }
    async getItemsByCategory(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            const category = req.params.category;
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            const items = await this.itemService.getItemsByCategory(companyId, category);
            res.json({
                success: true,
                data: items,
                message: `Found ${items.length} items in category "${category}"`
            });
        }
        catch (error) {
            console.error('Error in ItemController.getItemsByCategory:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get items by category'
            });
        }
    }
    async getCategories(req, res) {
        try {
            const companyId = parseInt(req.params.companyId);
            if (isNaN(companyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid company ID'
                });
                return;
            }
            const categories = await this.itemService.getCategories(companyId);
            res.json({
                success: true,
                data: categories,
                message: `Found ${categories.length} categories`
            });
        }
        catch (error) {
            console.error('Error in ItemController.getCategories:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
}
//# sourceMappingURL=ItemController.js.map