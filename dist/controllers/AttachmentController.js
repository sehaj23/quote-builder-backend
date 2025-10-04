import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
const upload = multer({ storage: multer.memoryStorage() });
export class AttachmentController {
    attachmentService;
    activityService;
    s3Client;
    bucketName;
    constructor(attachmentService, activityService) {
        this.attachmentService = attachmentService;
        this.activityService = activityService;
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
        this.bucketName = process.env.AWS_S3_BUCKET || '';
    }
    getUploadMiddleware() {
        return upload.single('file');
    }
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                const response = {
                    success: false,
                    error: 'No file uploaded'
                };
                return res.status(400).json(response);
            }
            const { companyId } = req.params;
            if (!companyId) {
                const response = {
                    success: false,
                    error: 'Company ID is required'
                };
                return res.status(400).json(response);
            }
            const { type = 'document', userId } = req.body;
            const timestamp = Date.now();
            const fileExtension = req.file.originalname.split('.').pop();
            const s3Key = `company-${companyId}/${type}/${timestamp}.${fileExtension}`;
            const putCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read'
            });
            await this.s3Client.send(putCommand);
            const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;
            const attachmentData = {
                company_id: parseInt(companyId),
                filename: `${timestamp}.${fileExtension}`,
                original_filename: req.file.originalname,
                s3_key: s3Key,
                s3_url: s3Url,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                type: type,
                uploaded_by: userId
            };
            const attachment = await this.attachmentService.createAttachment(attachmentData);
            if (userId) {
                await this.activityService.logActivity({
                    user_id: userId,
                    company_id: parseInt(companyId),
                    action: 'file_uploaded',
                    resource_type: 'attachment',
                    resource_id: attachment.id,
                    description: `Uploaded ${type}: ${req.file.originalname}`,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }
            const response = {
                success: true,
                data: attachment,
                message: 'File uploaded successfully'
            };
            return res.status(201).json(response);
        }
        catch (error) {
            console.error('Upload error:', error);
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getAttachments(req, res) {
        try {
            const { companyId } = req.params;
            const { type } = req.query;
            const attachments = await this.attachmentService.getAttachmentsByCompany(parseInt(companyId || ''), type);
            const response = {
                success: true,
                data: attachments,
                message: 'Attachments retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async getAttachmentById(req, res) {
        try {
            const { attachmentId } = req.params;
            const attachment = await this.attachmentService.getAttachmentById(parseInt(attachmentId || ''));
            if (!attachment) {
                const response = {
                    success: false,
                    error: 'Attachment not found'
                };
                return res.status(404).json(response);
            }
            const response = {
                success: true,
                data: attachment,
                message: 'Attachment retrieved successfully'
            };
            return res.json(response);
        }
        catch (error) {
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
    async deleteAttachment(req, res) {
        try {
            const { attachmentId } = req.params;
            const { userId } = req.body;
            const attachment = await this.attachmentService.getAttachmentById(parseInt(attachmentId || ''));
            if (!attachment) {
                const response = {
                    success: false,
                    error: 'Attachment not found'
                };
                return res.status(404).json(response);
            }
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: attachment.s3_key,
            });
            await this.s3Client.send(deleteCommand);
            await this.attachmentService.deleteAttachment(parseInt(attachmentId || ''));
            if (userId) {
                await this.activityService.logActivity({
                    user_id: userId,
                    company_id: attachment.company_id,
                    action: 'file_deleted',
                    resource_type: 'attachment',
                    resource_id: parseInt(attachmentId || ''),
                    description: `Deleted ${attachment.type}: ${attachment.original_filename}`,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
            }
            const response = {
                success: true,
                message: 'Attachment deleted successfully'
            };
            return res.json(response);
        }
        catch (error) {
            console.error('Delete error:', error);
            const response = {
                success: false,
                error: error.message
            };
            return res.status(500).json(response);
        }
    }
}
//# sourceMappingURL=AttachmentController.js.map