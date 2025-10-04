import { Request, Response } from 'express';
import { ItemService } from '@/services/ItemService.js';
import { CreateItemRequest, UpdateItemRequest, ApiResponse } from '@/types/index.js';

export class ItemController {
  constructor(private itemService: ItemService) {}

  // GET /api/companies/:companyId/items
  async getItemsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const search = req.query.search as string || '';
      const category = req.query.category as string || '';
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      if (page < 1 || pageSize < 1 || pageSize > 100) {
        res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100'
        } as ApiResponse);
        return;
      }

      const filters = {
        search: search.trim(),
        category: category.trim()
      };

      const result = await this.itemService.getItemsByCompanyPaginated(companyId, page, pageSize, filters);
      
      res.json({
        success: true,
        data: {
          items: result.items,
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalItems: result.totalCount,
            totalPages: Math.ceil(result.totalCount / pageSize),
            hasNextPage: page < Math.ceil(result.totalCount / pageSize),
            hasPrevPage: page > 1
          }
        },
        message: `Found ${result.totalCount} items for company ${companyId}`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.getItemsByCompany:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // GET /api/items/:id
  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const itemId = parseInt(req.params['id'] || '');
      
      if (isNaN(itemId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid item ID'
        } as ApiResponse);
        return;
      }

      const item = await this.itemService.getItemById(itemId);
      
      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: item,
        message: 'Item retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.getItemById:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // POST /api/companies/:companyId/items
  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      const itemData: CreateItemRequest = {
        ...req.body,
        company_id: companyId
      };

      const result = await this.itemService.createItem(itemData);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Item created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.createItem:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create item'
      } as ApiResponse);
    }
  }

  // PUT /api/items/:id
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const itemId = parseInt(req.params['id'] || '');
      
      if (isNaN(itemId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid item ID'
        } as ApiResponse);
        return;
      }

      const itemData: UpdateItemRequest = req.body;
      const updatedItem = await this.itemService.updateItem(itemId, itemData);
      
      if (!updatedItem) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: updatedItem,
        message: 'Item updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.updateItem:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update item'
      } as ApiResponse);
    }
  }

  // DELETE /api/items/:id
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const itemId = parseInt(req.params['id'] || '');
      
      if (isNaN(itemId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid item ID'
        } as ApiResponse);
        return;
      }

      const deleted = await this.itemService.deleteItem(itemId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: null,
        message: 'Item deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.deleteItem:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete item'
      } as ApiResponse);
    }
  }

  // GET /api/companies/:companyId/items/search?query=...
  async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      const query = req.query['query'] as string;
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        } as ApiResponse);
        return;
      }

      const items = await this.itemService.searchItems(companyId, query);
      
      res.json({
        success: true,
        data: items,
        message: `Found ${items.length} items matching "${query}"`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.searchItems:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search items'
      } as ApiResponse);
    }
  }

  // GET /api/companies/:companyId/items/category/:category
  async getItemsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      const category = req.params['category'];
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      const items = await this.itemService.getItemsByCategory(companyId, category || '');
      
      res.json({
        success: true,
        data: items,
        message: `Found ${items.length} items in category "${category}"`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.getItemsByCategory:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get items by category'
      } as ApiResponse);
    }
  }

  // GET /api/companies/:companyId/categories
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params['companyId'] || '');
      
      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid company ID'
        } as ApiResponse);
        return;
      }

      const categories = await this.itemService.getCategories(companyId);
      
      res.json({
        success: true,
        data: categories,
        message: `Found ${categories.length} categories`
      } as ApiResponse);
    } catch (error) {
      console.error('Error in ItemController.getCategories:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }
}