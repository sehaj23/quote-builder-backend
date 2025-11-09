import { Request, Response } from 'express';
import multer from 'multer';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  CreateBucketCommand, 
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  PutPublicAccessBlockCommand,
  BucketLocationConstraint
} from '@aws-sdk/client-s3';
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
    
    this.bucketName = this.validateAndNormalizeBucketName(process.env.AWS_S3_BUCKET || '');
  }

  // Validate and normalize S3 bucket name according to AWS rules
  private validateAndNormalizeBucketName(bucketName: string): string {
    if (!bucketName) {
      // Generate a default bucket name if none provided
      const timestamp = Date.now();
      bucketName = `quotebuilder-attachments-${timestamp}`;
      console.log(`🔧 No bucket name configured, generated: ${bucketName}`);
    }

    // Normalize bucket name to meet AWS requirements
    let normalizedName = bucketName
      .toLowerCase() // Must be lowercase
      .replace(/[^a-z0-9.-]/g, '-') // Only allow letters, numbers, dots, and hyphens
      .replace(/^[.-]|[.-]$|[.-]{2,}/g, '') // Remove leading/trailing dots/hyphens and consecutive dots/hyphens
      .replace(/--+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .substring(0, 63); // Max 63 characters

    // Ensure it doesn't start or end with a hyphen or dot
    normalizedName = normalizedName.replace(/^[-.]|[-.]$/g, '');

    // Ensure minimum length of 3 characters
    if (normalizedName.length < 3) {
      normalizedName = `quotebuilder-${Date.now().toString().slice(-6)}`;
    }

    // Validate final name
    if (!this.isValidBucketName(normalizedName)) {
      throw new Error(`Invalid S3 bucket name: ${normalizedName}. Please check AWS_S3_BUCKET environment variable.`);
    }

    if (normalizedName !== bucketName) {
      console.log(`🔧 Bucket name normalized from '${bucketName}' to '${normalizedName}'`);
    }

    return normalizedName;
  }

  // Check if bucket name meets AWS S3 naming rules
  private isValidBucketName(bucketName: string): boolean {
    // AWS S3 bucket naming rules
    const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
    
    return (
      bucketName.length >= 3 &&
      bucketName.length <= 63 &&
      bucketNameRegex.test(bucketName) &&
      !bucketName.includes('..') &&
      !bucketName.match(/^\d+\.\d+\.\d+\.\d+$/) && // Not an IP address
      !bucketName.startsWith('xn--') && // Not internationalized domain
      !bucketName.endsWith('-s3alias') &&
      !bucketName.endsWith('--ol-s3')
    );
  }

  // Check if bucket exists and create it if it doesn't
  private async ensureBucketExists(): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      // Check if bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: this.bucketName,
      });
      await this.s3Client.send(headCommand);
      
      console.log(`✅ S3 bucket ${this.bucketName} exists and is accessible`);
    } catch (error: any) {
      console.log(error)
      if (error.$metadata?.httpStatusCode === 404) {
        console.log(`🔧 Creating S3 bucket: ${this.bucketName}`);
        
        try {
          // Create the bucket
          const createCommand = new CreateBucketCommand({
            Bucket: this.bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_S3_REGION && process.env.AWS_S3_REGION !== 'us-east-1' 
                ? process.env.AWS_S3_REGION as BucketLocationConstraint 
                : undefined
            }
          });
          await this.s3Client.send(createCommand);
          
          // Configure public access block to allow bucket policy-based public access
          const publicAccessBlockCommand = new PutPublicAccessBlockCommand({
            Bucket: this.bucketName,
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,        // Block public ACLs (we don't need them)
              IgnorePublicAcls: true,       // Ignore public ACLs (we don't need them)
              BlockPublicPolicy: false,     // Allow public bucket policies (we need this)
              RestrictPublicBuckets: false  // Allow public bucket policies (we need this)
            }
          });
          await this.s3Client.send(publicAccessBlockCommand);
          
          // Set CORS configuration
          const corsCommand = new PutBucketCorsCommand({
            Bucket: this.bucketName,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedHeaders: ['*'],
                  AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                  AllowedOrigins: ['*'],
                  ExposeHeaders: ['ETag'],
                  MaxAgeSeconds: 3000,
                },
              ],
            },
          });
          await this.s3Client.send(corsCommand);
          
          // Set bucket policy for public read access to logos
          const bucketPolicyCommand = new PutBucketPolicyCommand({
            Bucket: this.bucketName,
            Policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'PublicReadGetObject',
                  Effect: 'Allow',
                  Principal: '*',
                  Action: 's3:GetObject',
                  Resource: `arn:aws:s3:::${this.bucketName}/company-*/logo/*`,
                },
              ],
            }),
          });
          await this.s3Client.send(bucketPolicyCommand);
          
          console.log(`✅ S3 bucket ${this.bucketName} created successfully with CORS and public access policy`);
        } catch (createError: any) {
          console.error('❌ Failed to create S3 bucket:', createError.message);
          
          // Provide more specific error messages
          let errorMessage = createError.message;
          if (createError.Code === 'InvalidBucketName' || createError.message?.includes('not valid')) {
            errorMessage = `Invalid bucket name '${this.bucketName}'. AWS S3 bucket names must be 3-63 characters, lowercase letters, numbers, dots and hyphens only. Current name: ${this.bucketName}`;
          } else if (createError.Code === 'BucketAlreadyExists') {
            errorMessage = `Bucket '${this.bucketName}' already exists and is owned by another AWS account. Try a different bucket name.`;
          } else if (createError.Code === 'BucketAlreadyOwnedByYou') {
            errorMessage = `Bucket '${this.bucketName}' already exists in your account but in a different region.`;
          } else if (createError.Code === 'AccessDenied') {
            errorMessage = `Access denied. Check your AWS credentials and permissions for S3 bucket creation.`;
          }
          
          throw new Error(`Failed to create S3 bucket: ${errorMessage}`);
        }
      } else {
        console.error('❌ S3 bucket access error:', error.message);
        throw new Error(`S3 bucket access error: ${error.message}`);
      }
    }
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
      const { type = 'image', userId } = req.body;
      
      // Ensure bucket exists
      await this.ensureBucketExists();
      
      // Generate S3 key
      const timestamp = Date.now();
      const fileExtension = req.file!.originalname.split('.').pop();
      const s3Key = `company-${companyId}/${type}/${timestamp}.${fileExtension}`;
      
      // Upload to S3 (without ACL - using bucket policy for public access)
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: req.file!.buffer,
        ContentType: req.file!.mimetype
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