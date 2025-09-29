import { Item, CreateItemRequest, UpdateItemRequest } from '@/types/index.js';
export declare class ItemRepository {
    private getDbConnection;
    findByCompanyId(companyId: number): Promise<Item[]>;
    findById(id: number): Promise<Item | null>;
    create(itemData: CreateItemRequest): Promise<number>;
    update(id: number, itemData: UpdateItemRequest): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    search(companyId: number, query: string): Promise<Item[]>;
    findByCategory(companyId: number, category: string): Promise<Item[]>;
    getCategories(companyId: number): Promise<string[]>;
}
//# sourceMappingURL=ItemRepository.d.ts.map