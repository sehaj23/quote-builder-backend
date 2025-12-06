import { jest } from '@jest/globals';
import { AttachmentController } from '../../src/controllers/AttachmentController.js';
import type { AttachmentService } from '../../src/services/AttachmentService.js';
import type { ActivityService } from '../../src/services/ActivityService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';
import { Readable } from 'stream';

const mockEnsureBucketExists = () =>
  jest.spyOn(AttachmentController.prototype as any, 'ensureBucketExists').mockResolvedValue(undefined);

type EnsureSpy = ReturnType<typeof mockEnsureBucketExists>;

const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'file.bin',
  encoding: '7bit',
  mimetype: 'application/octet-stream',
  size: 1,
  destination: '',
  filename: 'file.bin',
  path: '',
  buffer: Buffer.from(''),
  stream: Readable.from([]),
  ...overrides
});

const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('AttachmentController', () => {
  let controller: AttachmentController;
  let attachmentService: any;
  let activityService: any;
  let ensureSpy: EnsureSpy;

  beforeEach(() => {
    attachmentService = {
      createAttachment: createAsyncMock(),
      getAttachmentsByCompany: createAsyncMock(),
      getAttachmentById: createAsyncMock(),
      deleteAttachment: createAsyncMock()
    };

    activityService = {
      logActivity: createAsyncMock()
    };

    controller = new AttachmentController(
      attachmentService as unknown as AttachmentService,
      activityService as unknown as ActivityService
    );

    ensureSpy = mockEnsureBucketExists();
  });

  afterEach(() => {
    ensureSpy.mockRestore();
  });

  test('uploadFile validates presence of file and companyId', async () => {
    const reqNoFile: any = createMockRequest({ params: { companyId: '1' } });
    const resNoFile = createMockResponse();
    await controller.uploadFile(reqNoFile, resNoFile);
    expect(resNoFile.status).toHaveBeenCalledWith(400);

    const reqNoCompany: any = createMockRequest({ params: {}, file: createMockFile({ buffer: Buffer.from('a') }) });
    const resNoCompany = createMockResponse();
    await controller.uploadFile(reqNoCompany, resNoCompany);
    expect(resNoCompany.status).toHaveBeenCalledWith(400);
  });

  test('uploadFile stores attachment and logs activity', async () => {
    attachmentService.createAttachment.mockResolvedValue({ id: 1 } as any);
    const req: any = createMockRequest({
      params: { companyId: '7' },
      body: { type: 'image', userId: 'user-1' }
    });
    req.file = createMockFile({
      originalname: 'logo.png',
      buffer: Buffer.from('binary'),
      mimetype: 'image/png',
      size: 10
    });
    req.get.mockReturnValue('agent');
    const res = createMockResponse();

    await controller.uploadFile(req, res);

    expect(ensureSpy).toHaveBeenCalled();
    expect(attachmentService.createAttachment).toHaveBeenCalledWith(expect.objectContaining({
      company_id: 7,
      original_filename: 'logo.png'
    }));
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'file_uploaded',
      user_id: 'user-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('getAttachments retrieves by company and type', async () => {
    attachmentService.getAttachmentsByCompany.mockResolvedValue([]);
    const req = createMockRequest({ params: { companyId: '3' }, query: { type: 'doc' } });
    const res = createMockResponse();

    await controller.getAttachments(req, res);

    expect(attachmentService.getAttachmentsByCompany).toHaveBeenCalledWith(3, 'doc');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getAttachmentById handles not found', async () => {
    attachmentService.getAttachmentById.mockResolvedValue(null);
    const req = createMockRequest({ params: { attachmentId: '9' } });
    const res = createMockResponse();

    await controller.getAttachmentById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getAttachmentById returns attachment', async () => {
    attachmentService.getAttachmentById.mockResolvedValue({ id: 9 } as any);
    const req = createMockRequest({ params: { attachmentId: '9' } });
    const res = createMockResponse();

    await controller.getAttachmentById(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('deleteAttachment handles missing attachment', async () => {
    attachmentService.getAttachmentById.mockResolvedValue(null);
    const req = createMockRequest({ params: { attachmentId: '5' } });
    const res = createMockResponse();

    await controller.deleteAttachment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteAttachment removes attachment and logs activity', async () => {
    attachmentService.getAttachmentById.mockResolvedValue({
      id: 5,
      company_id: 4,
      s3_key: 'key',
      original_filename: 'file.pdf',
      type: 'doc'
    } as any);
    attachmentService.deleteAttachment.mockResolvedValue(undefined);
    const req: any = createMockRequest({ params: { attachmentId: '5' }, body: { userId: 'user-2' } });
    req.get.mockReturnValue('agent');
    const res = createMockResponse();

    await controller.deleteAttachment(req, res);

    expect(attachmentService.deleteAttachment).toHaveBeenCalledWith(5);
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'file_deleted',
      user_id: 'user-2'
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

