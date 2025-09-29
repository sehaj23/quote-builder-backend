import { Item, CreateItemRequest, UpdateItemRequest } from '@/types/index.js';
export declare class ItemService {
    private itemRepository;
    constructor();
    getItemsByCompany(companyId: number): Promise<Item[]>;
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