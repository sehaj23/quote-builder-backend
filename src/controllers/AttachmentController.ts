import { Request, Response } from 'express';
import multer from 'multer';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AttachmentService } from '../services/AttachmentService.js';
import { ActivityService } from '../services/ActivityService.js';
import { ApiResponse, CreateAttachmentRequest } from '../types/index.js';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export class AttachmentController {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private attachmentService: AttachmentService,
    private activityService: ActivityService
  ) {
    
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

  async uploadFile(req: MulterRequest, res: Response) {
    try {
      if (!req.file) {
        const response: ApiResponse = {
          success: false,
          error: 'No file uploaded'
        };
        return res.status(400).json(response);
      }

      const { companyId } = req.params;
      if (!companyId) {
        const response: ApiResponse = {
          success: false,
          error: 'Company ID is required'
        };
        return res.status(400).json(response);
      }
      const { type = 'document', userId } = req.body;
      
      // Generate S3 key
      const timestamp = Date.now();
      const fileExtension = req.file!.originalname.split('.').pop();
      const s3Key = `company-${companyId}/${type}/${timestamp}.${fileExtension}`;
      
      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: req.file!.buffer,
        ContentType: req.file!.mimetype,
        ACL: 'public-read'
      });

      await this.s3Client.send(putCommand);
      
      const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;

      // Save to database
      const attachmentData: CreateAttachmentRequest = {
        company_id: parseInt(companyId),
        filename: `${timestamp}.${fileExtension}`,
        original_filename: req.file!.originalname,
        s3_key: s3Key,
        s3_url: s3Url,
        file_size: req.file!.size,
        mime_type: req.file!.mimetype,
        type: type,
        uploaded_by: userId
      };

      const attachment = await this.attachmentService.createAttachment(attachmentData);

      // Log activity
      if (userId) {
        await this.activityService.logActivity({
          user_id: userId,
          company_id: parseInt(companyId),
          action: 'file_uploaded',
          resource_type: 'attachment',
          resource_id: attachment.id,
          description: `Uploaded ${type}: ${req.file!.originalname}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      }

      const response: ApiResponse = {
        success: true,
        data: attachment,
        message: 'File uploaded successfully'
      };
      return res.status(201).json(response);
    } catch (error: any) {
      console.error('Upload error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getAttachments(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { type } = req.query;
      
      const attachments = await this.attachmentService.getAttachmentsByCompany(
        parseInt(companyId || ''), 
        type as string
      );

      const response: ApiResponse = {
        success: true,
        data: attachments,
        message: 'Attachments retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async getAttachmentById(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      const attachment = await this.attachmentService.getAttachmentById(parseInt(attachmentId || ''));
      
      if (!attachment) {
        const response: ApiResponse = {
          success: false,
          error: 'Attachment not found'
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: attachment,
        message: 'Attachment retrieved successfully'
      };
      return res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }

  async deleteAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      const { userId } = req.body;
      
      const attachment = await this.attachmentService.getAttachmentById(parseInt(attachmentId || ''));
      
      if (!attachment) {
        const response: ApiResponse = {
          success: false,
          error: 'Attachment not found'
        };
        return res.status(404).json(response);
      }

      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: attachment.s3_key,
      });

      await this.s3Client.send(deleteCommand);

      // Delete from database
      await this.attachmentService.deleteAttachment(parseInt(attachmentId || ''));

      // Log activity
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

      const response: ApiResponse = {
        success: true,
        message: 'Attachment deleted successfully'
      };
      return res.json(response);
    } catch (error: any) {
      console.error('Delete error:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message
      };
      return res.status(500).json(response);
    }
  }
}