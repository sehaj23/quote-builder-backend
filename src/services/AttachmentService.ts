import { AttachmentRepository } from '../repositories/AttachmentRepository.js';
import { Attachment, CreateAttachmentRequest } from '../types/index.js';

export class AttachmentService {
  constructor(private attachmentRepository: AttachmentRepository) {}

  async createAttachment(attachmentData: CreateAttachmentRequest): Promise<Attachment> {
    return this.attachmentRepository.create(attachmentData);
  }

  async getAttachmentById(id: number): Promise<Attachment | null> {
    return this.attachmentRepository.findById(id);
  }

  async getAttachmentsByCompany(companyId: number, type?: string): Promise<Attachment[]> {
    return this.attachmentRepository.findByCompany(companyId, type);
  }

  async getAttachmentsByUser(userId: string): Promise<Attachment[]> {
    return this.attachmentRepository.findByUser(userId);
  }

  async getAttachmentsByType(type: string, companyId?: number): Promise<Attachment[]> {
    return this.attachmentRepository.findByType(type, companyId);
  }

  async updateAttachment(id: number, updateData: Partial<Attachment>): Promise<Attachment | null> {
    return this.attachmentRepository.update(id, updateData);
  }

  async deleteAttachment(id: number): Promise<boolean> {
    return this.attachmentRepository.delete(id);
  }

  async getLogoAttachment(companyId: number): Promise<Attachment | null> {
    return this.attachmentRepository.findLogo(companyId);
  }

  async getAttachmentStats(companyId?: number): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    return this.attachmentRepository.getStats(companyId);
  }

  async getAllAttachments(limit?: number, offset?: number): Promise<Attachment[]> {
    return this.attachmentRepository.findAll(limit, offset);
  }

  async getRecentAttachments(limit?: number, companyId?: number): Promise<Attachment[]> {
    return this.attachmentRepository.findRecent(limit, companyId);
  }

  async findByS3Key(s3Key: string): Promise<Attachment | null> {
    return this.attachmentRepository.findByS3Key(s3Key);
  }

  async getLargeFiles(minSize: number, companyId?: number): Promise<Attachment[]> {
    return this.attachmentRepository.findLargeFiles(minSize, companyId);
  }
}