import { Item, CreateItemRequest, UpdateItemRequest } from '../types/index.js';
import { ItemRepository } from '../repositories/ItemRepository.js';

export class ItemService {
  constructor(private itemRepository: ItemRepository) {}

  async getItemsByCompany(companyId: number): Promise<Item[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    return await this.itemRepository.findByCompanyId(companyId);
  }

  async getItemsByCompanyPaginated(
    companyId: number, 
    page: number, 
    pageSize: number, 
    filters: { search?: string; category?: string }
  ): Promise<{ items: Item[]; totalCount: number }> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    if (page < 1 || pageSize < 1) {
      throw new Error('Page and pageSize must be positive integers');
    }

    const offset = (page - 1) * pageSize;
    const items = await this.itemRepository.findByCompanyIdPaginated(
      companyId, 
      pageSize, 
      offset, 
      filters
    );
    const totalCount = await this.itemRepository.countByCompanyId(companyId, filters);

    return {
      items,
      totalCount
    };
  }

  async getItemById(id: number): Promise<Item | null> {
    if (!id || id <= 0) {
      throw new Error('Valid item ID is required');
    }

    return await this.itemRepository.findById(id);
  }

  async createItem(itemData: CreateItemRequest): Promise<{ id: number; item: Item }> {
    // Validate required fields
    if (!itemData.name || itemData.name.trim().length === 0) {
      throw new Error('Item name is required');
    }
    
    if (!itemData.company_id || itemData.company_id <= 0) {
      throw new Error('Valid company ID is required');
    }

    if (!itemData.unit || itemData.unit.trim().length === 0) {
      throw new Error('Unit is required');
    }

    if (!itemData.unit_cost || itemData.unit_cost < 0) {
      throw new Error('Valid unit cost is required');
    }

    // Sanitize input data
    const sanitizedData: CreateItemRequest = {
      company_id: itemData.company_id,
      name: itemData.name.trim(),
      unit: itemData.unit.trim(),
      unit_cost: itemData.unit_cost,
      default_area: itemData.default_area || 1,
      economy_unit_cost: itemData.economy_unit_cost || itemData.unit_cost,
      luxury_unit_cost: itemData.luxury_unit_cost || itemData.unit_cost
    };
    
    if (itemData.default_description?.trim()) {
      sanitizedData.default_description = itemData.default_description.trim();
    }
    if (itemData.tags?.trim()) {
      sanitizedData.tags = itemData.tags.trim();
    }
    if (itemData.category?.trim()) {
      sanitizedData.category = itemData.category.trim();
    }

    try {
      const newItemId = await this.itemRepository.create(sanitizedData);
      const newItem = await this.itemRepository.findById(newItemId);
      
      if (!newItem) {
        throw new Error('Failed to retrieve created item');
      }

      return {
        id: newItemId,
        item: newItem
      };
    } catch (error) {
      console.error('Error in ItemService.createItem:', error);
      throw error;
    }
  }

  async updateItem(id: number, itemData: UpdateItemRequest): Promise<Item | null> {
    if (!id || id <= 0) {
      throw new Error('Valid item ID is required');
    }

    // Check if item exists
    const existingItem = await this.itemRepository.findById(id);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    // Validate updated fields
    if (itemData.name !== undefined && itemData.name.trim().length === 0) {
      throw new Error('Item name cannot be empty');
    }

    if (itemData.unit !== undefined && itemData.unit.trim().length === 0) {
      throw new Error('Unit cannot be empty');
    }

    if (itemData.unit_cost !== undefined && itemData.unit_cost < 0) {
      throw new Error('Unit cost cannot be negative');
    }

    // Sanitize input data
    const sanitizedData: UpdateItemRequest = {};
    
    if (itemData.name !== undefined) {
      sanitizedData.name = itemData.name.trim();
    }
    if (itemData.default_description !== undefined) {
      if (itemData.default_description?.trim()) {
        sanitizedData.default_description = itemData.default_description.trim();
      }
    }
    if (itemData.unit !== undefined) {
      sanitizedData.unit = itemData.unit.trim();
    }
    if (itemData.default_area !== undefined) {
      sanitizedData.default_area = itemData.default_area;
    }
    if (itemData.unit_cost !== undefined) {
      sanitizedData.unit_cost = itemData.unit_cost;
    }
    if (itemData.economy_unit_cost !== undefined) {
      sanitizedData.economy_unit_cost = itemData.economy_unit_cost;
    }
    if (itemData.luxury_unit_cost !== undefined) {
      sanitizedData.luxury_unit_cost = itemData.luxury_unit_cost;
    }
    if (itemData.tags !== undefined) {
      if (itemData.tags?.trim()) {
        sanitizedData.tags = itemData.tags.trim();
      }
    }
    if (itemData.category !== undefined) {
      if (itemData.category?.trim()) {
        sanitizedData.category = itemData.category.trim();
      }
    }

    try {
      const updateSuccess = await this.itemRepository.update(id, sanitizedData);
      
      if (!updateSuccess) {
        throw new Error('Failed to update item');
      }

      return await this.itemRepository.findById(id);
    } catch (error) {
      console.error('Error in ItemService.updateItem:', error);
      throw error;
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Valid item ID is required');
    }

    // Check if item exists
    const existingItem = await this.itemRepository.findById(id);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    try {
      return await this.itemRepository.delete(id);
    } catch (error) {
      console.error('Error in ItemService.deleteItem:', error);
      throw error;
    }
  }

  async searchItems(companyId: number, query: string): Promise<Item[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return await this.itemRepository.search(companyId, query.trim());
  }

  async getItemsByCategory(companyId: number, category: string): Promise<Item[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    if (!category || category.trim().length === 0) {
      throw new Error('Category is required');
    }

    return await this.itemRepository.findByCategory(companyId, category.trim());
  }

  async getCategories(companyId: number): Promise<string[]> {
    if (!companyId || companyId <= 0) {
      throw new Error('Valid company ID is required');
    }

    return await this.itemRepository.getCategories(companyId);
  }
}