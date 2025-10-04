import { Attachment, CreateAttachmentRequest } from '@/types/index.js';
export declare class AttachmentRepository {
    create(attachmentData: CreateAttachmentRequest): Promise<Attachment>;
    findById(id: number): Promise<Attachment | null>;
    findByCompany(companyId: number, type?: string): Promise<Attachment[]>;
    findByUser(userId: string): Promise<Attachment[]>;
    findByType(type: string, companyId?: number): Promise<Attachment[]>;
    update(id: number, updateData: Partial<Attachment>): Promise<Attachment | null>;
    delete(id: number): Promise<boolean>;
    findLogo(companyId: number): Promise<Attachment | null>;
    findAll(limit?: number, offset?: number): Promise<Attachment[]>;
    getStats(companyId?: number): Promise<{
        total: number;
        byType: Record<string, number>;
        totalSize: number;
    }>;
    findRecent(limit?: number, companyId?: number): Promise<Attachment[]>;
    findByS3Key(s3Key: string): Promise<Attachment | null>;
    findLargeFiles(minSize: number, companyId?: number): Promise<Attachment[]>;
}
//# sourceMappingURL=AttachmentRepository.d.ts.map