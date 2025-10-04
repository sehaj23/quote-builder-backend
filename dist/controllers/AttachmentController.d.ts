import { Request, Response } from 'express';
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}
import { AttachmentService } from '../services/AttachmentService.js';
import { ActivityService } from '../services/ActivityService.js';
export declare class AttachmentController {
    private attachmentService;
    private activityService;
    private s3Client;
    private bucketName;
    constructor(attachmentService: AttachmentService, activityService: ActivityService);
    getUploadMiddleware(): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    uploadFile(req: MulterRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAttachments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAttachmentById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAttachment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
//# sourceMappingURL=AttachmentController.d.ts.map