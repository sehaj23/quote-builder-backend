export class AttachmentService {
    attachmentRepository;
    constructor(attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }
    async createAttachment(attachmentData) {
        return this.attachmentRepository.create(attachmentData);
    }
    async getAttachmentById(id) {
        return this.attachmentRepository.findById(id);
    }
    async getAttachmentsByCompany(companyId, type) {
        return this.attachmentRepository.findByCompany(companyId, type);
    }
    async getAttachmentsByUser(userId) {
        return this.attachmentRepository.findByUser(userId);
    }
    async getAttachmentsByType(type, companyId) {
        return this.attachmentRepository.findByType(type, companyId);
    }
    async updateAttachment(id, updateData) {
        return this.attachmentRepository.update(id, updateData);
    }
    async deleteAttachment(id) {
        return this.attachmentRepository.delete(id);
    }
    async getLogoAttachment(companyId) {
        return this.attachmentRepository.findLogo(companyId);
    }
    async getAttachmentStats(companyId) {
        return this.attachmentRepository.getStats(companyId);
    }
    async getAllAttachments(limit, offset) {
        return this.attachmentRepository.findAll(limit, offset);
    }
    async getRecentAttachments(limit, companyId) {
        return this.attachmentRepository.findRecent(limit, companyId);
    }
    async findByS3Key(s3Key) {
        return this.attachmentRepository.findByS3Key(s3Key);
    }
    async getLargeFiles(minSize, companyId) {
        return this.attachmentRepository.findLargeFiles(minSize, companyId);
    }
}
//# sourceMappingURL=AttachmentService.js.map