import { AttachmentRepository } from '@/repositories/AttachmentRepository.js';
import { Attachment, CreateAttachmentRequest } from '@/types/index.js';
export declare class AttachmentService {
    private attachmentRepository;
    constructor(attachmentRepository: AttachmentRepository);
    createAttachment(attachmentData: CreateAttachmentRequest): Promise<Attachment>;
    getAttachmentById(id: number): Promise<Attachment | null>;
    getAttachmentsByCompany(companyId: number, type?: string): Promise<Attachment[]>;
    getAttachmentsByUser(userId: string): Promise<Attachment[]>;
    getAttachmentsByType(type: string, companyId?: number): Promise<Attachment[]>;
    updateAttachment(id: number, updateData: Partial<Attachment>): Promise<Attachment | null>;
    deleteAttachment(id: number): Promise<boolean>;
    getLogoAttachment(companyId: number): Promise<Attachment | null>;
    getAttachmentStats(companyId?: number): Promise<{
        total: number;
        byType: Record<string, number>;
        totalSize: number;
    }>;
    getAllAttachments(limit?: number, offset?: number): Promise<Attachment[]>;
    getRecentAttachments(limit?: number, companyId?: number): Promise<Attachment[]>;
    findByS3Key(s3Key: string): Promise<Attachment | null>;
    getLargeFiles(minSize: number, companyId?: number): Promise<Attachment[]>;
}
//# sourceMappingURL=AttachmentService.d.ts.map