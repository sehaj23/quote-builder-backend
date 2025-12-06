import { jest } from '@jest/globals';
import { validationResult } from 'express-validator';
import { ActivityController } from '../../src/controllers/ActivityController.js';
import type { ActivityService } from '../../src/services/ActivityService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

const mockValidationResult = validationResult as unknown as jest.Mock;
const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: any;

  beforeEach(() => {
    service = {
      getActivities: createAsyncMock(),
      getActivityById: createAsyncMock(),
      logActivity: createAsyncMock(),
      getActivityStats: createAsyncMock()
    };

    controller = new ActivityController(service as unknown as ActivityService);
    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  test('getActivities forwards filters to service', async () => {
    const req = createMockRequest({
      params: { companyId: '3' },
      query: { userId: 'user-1', action: 'login', limit: '25', offset: '5' }
    });
    const res = createMockResponse();

    await controller.getActivities(req, res);

    expect(service.getActivities).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 3,
      userId: 'user-1',
      action: 'login',
      limit: 25,
      offset: 5
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getActivityById returns 404 when missing', async () => {
    service.getActivityById.mockResolvedValue(null as any);
    const req = createMockRequest({ params: { activityId: '9' } });
    const res = createMockResponse();

    await controller.getActivityById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getActivityById returns activity when found', async () => {
    service.getActivityById.mockResolvedValue({ id: 9 } as any);
    const req = createMockRequest({ params: { activityId: '9' } });
    const res = createMockResponse();

    await controller.getActivityById(req, res);

    expect(service.getActivityById).toHaveBeenCalledWith(9);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserActivities filters by userId', async () => {
    const req = createMockRequest({
      params: { userId: 'user-2' },
      query: { limit: '10', offset: '0' }
    });
    const res = createMockResponse();

    await controller.getUserActivities(req, res);

    expect(service.getActivities).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-2',
      limit: 10,
      offset: 0
    }));
  });

  test('getCompanyActivities enforces companyId', async () => {
    const req = createMockRequest({
      params: { companyId: '4' },
      query: { limit: '5', offset: '2' }
    });
    const res = createMockResponse();

    await controller.getCompanyActivities(req, res);

    expect(service.getActivities).toHaveBeenCalledWith({
      companyId: 4,
      limit: 5,
      offset: 2
    });
  });

  test('logActivity rejects validation errors', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'error' }]
    });
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    await controller.logActivity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.logActivity).not.toHaveBeenCalled();
  });

  test('logActivity logs when valid', async () => {
    const req = createMockRequest({
      body: { user_id: 'u1', action: 'login' }
    });
    req.get.mockReturnValue('agent');
    const res = createMockResponse();

    await controller.logActivity(req, res);

    expect(service.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'u1',
      user_agent: 'agent',
      ip_address: '127.0.0.1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('getActivityStats handles optional company', async () => {
    service.getActivityStats.mockResolvedValue({ count: 1 } as any);
    const req = createMockRequest({ params: { companyId: '6' } });
    const res = createMockResponse();

    await controller.getActivityStats(req, res);

    expect(service.getActivityStats).toHaveBeenCalledWith(6);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

