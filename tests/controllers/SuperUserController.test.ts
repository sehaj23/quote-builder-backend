import { jest } from '@jest/globals';
import { validationResult } from 'express-validator';
import { SuperUserController } from '../../src/controllers/SuperUserController.js';
import type { SuperUserService } from '../../src/services/SuperUserService.js';
import type { ActivityService } from '../../src/services/ActivityService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

const mockValidationResult = validationResult as unknown as jest.Mock;
const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('SuperUserController', () => {
  let controller: SuperUserController;
  let superUserService: any;
  let activityService: any;

  beforeEach(() => {
    superUserService = {
      getUsersByCompany: createAsyncMock(),
      createUserForCompany: createAsyncMock(),
      getUserById: createAsyncMock(),
      updateUserInCompany: createAsyncMock(),
      removeUserFromCompany: createAsyncMock(),
      getAllUsers: createAsyncMock(),
      getUserStats: createAsyncMock(),
      getCompanyUserStats: createAsyncMock()
    };

    activityService = {
      logActivity: createAsyncMock(),
      getCompanyActivities: createAsyncMock(),
      countActivitiesByCompany: createAsyncMock()
    };

    controller = new SuperUserController(
      superUserService as unknown as SuperUserService,
      activityService as unknown as ActivityService
    );

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  test('getUsersByCompany validates company id', async () => {
    const missingReq = createMockRequest({ params: {} });
    const missingRes = createMockResponse();
    await controller.getUsersByCompany(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    const invalidReq = createMockRequest({ params: { companyId: 'abc' } });
    const invalidRes = createMockResponse();
    await controller.getUsersByCompany(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);
  });

  test('getUsersByCompany returns data', async () => {
    superUserService.getUsersByCompany.mockResolvedValue([{ id: 'u1', email: 'user1@test.com' }]);
    const req = createMockRequest({ params: { companyId: '5' } });
    const res = createMockResponse();

    await controller.getUsersByCompany(req, res);

    expect(superUserService.getUsersByCompany).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('createUserForCompany validates input and password', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => []
    });
    const reqInvalid = createMockRequest({ params: { companyId: '1' }, body: {} });
    const resInvalid = createMockResponse();
    await controller.createUserForCompany(reqInvalid, resInvalid);
    expect(resInvalid.status).toHaveBeenCalledWith(400);

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    const missingCompanyReq = createMockRequest({ params: {}, body: { password: 'pw' } });
    const missingCompanyRes = createMockResponse();
    await controller.createUserForCompany(missingCompanyReq, missingCompanyRes);
    expect(missingCompanyRes.status).toHaveBeenCalledWith(400);

    const missingPasswordReq = createMockRequest({ params: { companyId: '2' }, body: {} });
    const missingPasswordRes = createMockResponse();
    await controller.createUserForCompany(missingPasswordReq, missingPasswordRes);
    expect(missingPasswordRes.status).toHaveBeenCalledWith(400);
  });

  test('createUserForCompany creates user and logs activity', async () => {
    superUserService.createUserForCompany.mockResolvedValue({ id: 'u2' } as any);
    superUserService.getUserById.mockResolvedValue({ name: 'Admin User' } as any);
    const req: any = createMockRequest({ params: { companyId: '2' }, body: { email: 'u@test.com', password: 'secret' } });
    req.user = { id: 'admin-1' };
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.createUserForCompany(req, res);

    expect(superUserService.createUserForCompany).toHaveBeenCalledWith(2, expect.objectContaining({ email: 'u@test.com' }));
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_created_by_admin',
      company_id: 2
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateUserInCompany validates identifiers', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => []
    });
    const invalidReq = createMockRequest({ params: { companyId: '1', userId: 'u1' }, body: {} });
    const invalidRes = createMockResponse();
    await controller.updateUserInCompany(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    const missingCompanyReq = createMockRequest({ params: { userId: 'u1' }, body: {} });
    const missingCompanyRes = createMockResponse();
    await controller.updateUserInCompany(missingCompanyReq, missingCompanyRes);
    expect(missingCompanyRes.status).toHaveBeenCalledWith(400);

    const missingUserReq = createMockRequest({ params: { companyId: '1' }, body: {} });
    const missingUserRes = createMockResponse();
    await controller.updateUserInCompany(missingUserReq, missingUserRes);
    expect(missingUserRes.status).toHaveBeenCalledWith(400);
  });

  test('updateUserInCompany handles not found and logs activity', async () => {
    superUserService.updateUserInCompany.mockResolvedValue(null);
    const notFoundReq = createMockRequest({ params: { companyId: '1', userId: 'u1' }, body: {} });
    const notFoundRes = createMockResponse();
    await controller.updateUserInCompany(notFoundReq, notFoundRes);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);

    superUserService.updateUserInCompany.mockResolvedValue({ email: 'u1@test.com' } as any);
    superUserService.getUserById.mockResolvedValue({ name: 'Admin' } as any);
    const req: any = createMockRequest({ params: { companyId: '3', userId: 'u1' }, body: { name: 'User' } });
    req.user = { id: 'admin-2' };
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();
    await controller.updateUserInCompany(req, res);
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_updated_by_admin',
      company_id: 3
    }));
  });

  test('removeUserFromCompany validates identifiers and result', async () => {
    const missingCompanyReq = createMockRequest({ params: { userId: 'u1' } });
    const missingCompanyRes = createMockResponse();
    await controller.removeUserFromCompany(missingCompanyReq, missingCompanyRes);
    expect(missingCompanyRes.status).toHaveBeenCalledWith(400);

    const missingUserReq = createMockRequest({ params: { companyId: '1' } });
    const missingUserRes = createMockResponse();
    await controller.removeUserFromCompany(missingUserReq, missingUserRes);
    expect(missingUserRes.status).toHaveBeenCalledWith(400);

    superUserService.removeUserFromCompany.mockResolvedValue(false);
    const failureReq = createMockRequest({ params: { companyId: '1', userId: 'u1' } });
    const failureRes = createMockResponse();
    await controller.removeUserFromCompany(failureReq, failureRes);
    expect(failureRes.status).toHaveBeenCalledWith(500);
  });

  test('removeUserFromCompany succeeds and logs activity', async () => {
    superUserService.removeUserFromCompany.mockResolvedValue(true);
    superUserService.getUserById.mockResolvedValue({ email: 'admin@test.com' } as any);
    const req: any = createMockRequest({ params: { companyId: '2', userId: 'u1' } });
    req.user = { id: 'admin-3' };
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.removeUserFromCompany(req, res);

    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_removed_by_admin',
      company_id: 2
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserById validates and returns user', async () => {
    const missingReq = createMockRequest({ params: {} });
    const missingRes = createMockResponse();
    await controller.getUserById(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    superUserService.getUserById.mockResolvedValue(null);
    const notFoundReq = createMockRequest({ params: { userId: 'u1' } });
    const notFoundRes = createMockResponse();
    await controller.getUserById(notFoundReq, notFoundRes);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);

    superUserService.getUserById.mockResolvedValue({ id: 'u1' } as any);
    const req = createMockRequest({ params: { userId: 'u1' } });
    const res = createMockResponse();
    await controller.getUserById(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getAllUsers returns list', async () => {
    superUserService.getAllUsers.mockResolvedValue([{ id: 'u1', email: 'user1@test.com' }]);
    const res = createMockResponse();
    await controller.getAllUsers(createMockRequest(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserStats returns stats', async () => {
    superUserService.getUserStats.mockResolvedValue({ total: 5 } as any);
    const res = createMockResponse();
    await controller.getUserStats(createMockRequest(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getCompanyUserStats validates company', async () => {
    const missingReq = createMockRequest({ params: {} });
    const missingRes = createMockResponse();
    await controller.getCompanyUserStats(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    const invalidReq = createMockRequest({ params: { companyId: 'NaN' } });
    const invalidRes = createMockResponse();
    await controller.getCompanyUserStats(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);
  });

  test('getCompanyUserStats returns stats', async () => {
    superUserService.getCompanyUserStats.mockResolvedValue({ total: 2 } as any);
    const req = createMockRequest({ params: { companyId: '4' } });
    const res = createMockResponse();
    await controller.getCompanyUserStats(req, res);
    expect(superUserService.getCompanyUserStats).toHaveBeenCalledWith(4);
  });

  test('getCompanyUsersActivity validates context and pagination', async () => {
    const missingCompanyReq: any = createMockRequest();
    missingCompanyReq.user = {};
    const missingRes = createMockResponse();
    await controller.getCompanyUsersActivity(missingCompanyReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    const invalidPaginationReq: any = createMockRequest({ query: { page: '0', pageSize: '10' } });
    invalidPaginationReq.user = { company_id: 3 };
    const invalidPaginationRes = createMockResponse();
    await controller.getCompanyUsersActivity(invalidPaginationReq, invalidPaginationRes);
    expect(invalidPaginationRes.status).toHaveBeenCalledWith(400);
  });

  test('getCompanyUsersActivity returns transformed data', async () => {
    activityService.getCompanyActivities.mockResolvedValue([
      {
        action: 'login',
        description: 'User logged in',
        user_name: 'Jane',
        user_email: 'jane@example.com',
        resource_type: 'session',
        created_at: '2024-01-01',
        ip_address: '::1',
        user_agent: 'agent'
      }
    ] as any);
    activityService.countActivitiesByCompany.mockResolvedValue(1);
    const req: any = createMockRequest({ query: { page: '1', pageSize: '20' } });
    req.user = { company_id: 5 };
    const res = createMockResponse();

    await controller.getCompanyUsersActivity(req, res);

    expect(activityService.getCompanyActivities).toHaveBeenCalledWith(5, 20, 0);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        activities: [
          expect.objectContaining({
            action: 'login',
            performedBy: 'Jane'
          })
        ]
      })
    }));
  });
});

