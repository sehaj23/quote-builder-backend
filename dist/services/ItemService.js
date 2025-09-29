import { ItemRepository } from '@/repositories/ItemRepository.js';
export class ItemService {
    itemRepository;
    constructor() {
        this.itemRepository = new ItemRepository();
    }
    async getItemsByCompany(companyId) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        return await this.itemRepository.findByCompanyId(companyId);
    }
    async getItemById(id) {
        if (!id || id <= 0) {
            throw new Error('Valid item ID is required');
        }
        return await this.itemRepository.findById(id);
    }
    async createItem(itemData) {
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
        const sanitizedData = {
            ...itemData,
            name: itemData.name.trim(),
            default_description: itemData.default_description?.trim() || null,
            unit: itemData.unit.trim(),
            tags: itemData.tags?.trim() || null,
            category: itemData.category?.trim() || null,
            default_area: itemData.default_area || 1,
            economy_unit_cost: itemData.economy_unit_cost || itemData.unit_cost,
            luxury_unit_cost: itemData.luxury_unit_cost || itemData.unit_cost
        };
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
        }
        catch (error) {
            console.error('Error in ItemService.createItem:', error);
            throw error;
        }
    }
    async updateItem(id, itemData) {
        if (!id || id <= 0) {
            throw new Error('Valid item ID is required');
        }
        const existingItem = await this.itemRepository.findById(id);
        if (!existingItem) {
            throw new Error('Item not found');
        }
        if (itemData.name !== undefined && itemData.name.trim().length === 0) {
            throw new Error('Item name cannot be empty');
        }
        if (itemData.unit !== undefined && itemData.unit.trim().length === 0) {
            throw new Error('Unit cannot be empty');
        }
        if (itemData.unit_cost !== undefined && itemData.unit_cost < 0) {
            throw new Error('Unit cost cannot be negative');
        }
        const sanitizedData = {};
        if (itemData.name !== undefined) {
            sanitizedData.name = itemData.name.trim();
        }
        if (itemData.default_description !== undefined) {
            sanitizedData.default_description = itemData.default_description?.trim() || null;
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
            sanitizedData.tags = itemData.tags?.trim() || null;
        }
        if (itemData.category !== undefined) {
            sanitizedData.category = itemData.category?.trim() || null;
        }
        try {
            const updateSuccess = await this.itemRepository.update(id, sanitizedData);
            if (!updateSuccess) {
                throw new Error('Failed to update item');
            }
            return await this.itemRepository.findById(id);
        }
        catch (error) {
            console.error('Error in ItemService.updateItem:', error);
            throw error;
        }
    }
    async deleteItem(id) {
        if (!id || id <= 0) {
            throw new Error('Valid item ID is required');
        }
        const existingItem = await this.itemRepository.findById(id);
        if (!existingItem) {
            throw new Error('Item not found');
        }
        try {
            return await this.itemRepository.delete(id);
        }
        catch (error) {
            console.error('Error in ItemService.deleteItem:', error);
            throw error;
        }
    }
    async searchItems(companyId, query) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!query || query.trim().length < 2) {
            throw new Error('Search query must be at least 2 characters');
        }
        return await this.itemRepository.search(companyId, query.trim());
    }
    async getItemsByCategory(companyId, category) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        if (!category || category.trim().length === 0) {
            throw new Error('Category is required');
        }
        return await this.itemRepository.findByCategory(companyId, category.trim());
    }
    async getCategories(companyId) {
        if (!companyId || companyId <= 0) {
            throw new Error('Valid company ID is required');
        }
        return await this.itemRepository.getCategories(companyId);
    }
}
//# sourceMappingURL=ItemService.js.map