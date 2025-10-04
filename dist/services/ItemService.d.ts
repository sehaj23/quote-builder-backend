import { Item, CreateItemRequest, UpdateItemRequest } from '@/types/index.js';
import { ItemRepository } from '@/repositories/ItemRepository.js';
export declare class ItemService {
    private itemRepository;
    constructor(itemRepository: ItemRepository);
    getItemsByCompany(companyId: number): Promise<Item[]>;
    getItemsByCompanyPaginated(companyId: number, page: number, pageSize: number, filters: {
        search?: string;
        category?: string;
    }): Promise<{
        items: Item[];
        totalCount: number;
    }>;
    getItemById(id: number): Promise<Item | null>;
    createItem(itemData: CreateItemRequest): Promise<{
        id: number;
        item: Item;
    }>;
    updateItem(id: number, itemData: UpdateItemRequest): Promise<Item | null>;
    deleteItem(id: number): Promise<boolean>;
    searchItems(companyId: number, query: string): Promise<Item[]>;
    getItemsByCategory(companyId: number, category: string): Promise<Item[]>;
    getCategories(companyId: number): Promise<string[]>;
}
//# sourceMappingURL=ItemService.d.ts.map