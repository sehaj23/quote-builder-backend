import { jest } from '@jest/globals';
import { validationResult } from 'express-validator';
import { UserController } from '../../src/controllers/UserController.js';
import type { UserService } from '../../src/services/UserService.js';
import type { ActivityService } from '../../src/services/ActivityService.js';
import type { CompanyService } from '../../src/services/CompanyService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

const mockValidationResult = validationResult as unknown as jest.Mock;
const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('UserController', () => {
  let controller: UserController;
  let userService: any;
  let activityService: any;
  let companyService: any;

  beforeEach(() => {
    userService = {
      getUserById: createAsyncMock(),
      getAllUsers: createAsyncMock(),
      createUser: createAsyncMock(),
      updateUser: createAsyncMock(),
      getPendingUsers: createAsyncMock(),
      updateLastActivity: createAsyncMock()
    };

    activityService = {
      logActivity: createAsyncMock()
    };

    companyService = {
      getCompanyById: createAsyncMock()
    };

    controller = new UserController(
      userService as unknown as UserService,
      activityService as unknown as ActivityService,
      companyService as unknown as CompanyService
    );

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  test('getUserDetailsWithCompany returns combined data', async () => {
    const req: any = createMockRequest();
    req.user = { id: 'user-1' };
    userService.getUserById.mockResolvedValue({ id: 'user-1', company_id: 2 } as any);
    companyService.getCompanyById.mockResolvedValue({ id: 2, name: 'Acme' } as any);
    const res = createMockResponse();

    await controller.getUserDetailsWithCompany(req, res);

    expect(userService.getUserById).toHaveBeenCalledWith('user-1');
    expect(companyService.getCompanyById).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserDetailsWithCompany handles missing user', async () => {
    const req: any = createMockRequest();
    req.user = { id: 'user-2' };
    userService.getUserById.mockResolvedValue(null);
    const res = createMockResponse();

    await controller.getUserDetailsWithCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getAllUsers returns list', async () => {
    userService.getAllUsers.mockResolvedValue([{ id: '1' }]);
    const res = createMockResponse();

    await controller.getAllUsers(createMockRequest(), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserById validates param and handles missing user', async () => {
    const missingIdReq = createMockRequest({ params: {} });
    const missingIdRes = createMockResponse();
    await controller.getUserById(missingIdReq, missingIdRes);
    expect(missingIdRes.status).toHaveBeenCalledWith(400);

    userService.getUserById.mockResolvedValue(null);
    const missingUserReq = createMockRequest({ params: { userId: 'u1' } });
    const missingUserRes = createMockResponse();
    await controller.getUserById(missingUserReq, missingUserRes);
    expect(missingUserRes.status).toHaveBeenCalledWith(404);
  });

  test('getUserById returns user', async () => {
    userService.getUserById.mockResolvedValue({ id: 'u1' } as any);
    const req = createMockRequest({ params: { userId: 'u1' } });
    const res = createMockResponse();

    await controller.getUserById(req, res);

    expect(userService.getUserById).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('createUser rejects validation errors', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'err' }]
    });
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    await controller.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  test('createUser persists user and logs activity', async () => {
    userService.createUser.mockResolvedValue({ id: 'u2' } as any);
    const req = createMockRequest({ body: { email: 'user@example.com', company_id: 9 } });
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.createUser(req, res);

    expect(userService.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'user@example.com',
      company_id: 9
    }));
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_created'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateUser validates input and handles missing user', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => []
    });
    const invalidReq = createMockRequest({ params: { userId: 'u1' }, body: {} });
    const invalidRes = createMockResponse();
    await controller.updateUser(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    const missingIdReq = createMockRequest({ params: {} });
    const missingIdRes = createMockResponse();
    await controller.updateUser(missingIdReq, missingIdRes);
    expect(missingIdRes.status).toHaveBeenCalledWith(400);

    userService.updateUser.mockResolvedValue(null);
    const missingUserReq = createMockRequest({ params: { userId: 'u1' }, body: {} });
    const missingUserRes = createMockResponse();
    await controller.updateUser(missingUserReq, missingUserRes);
    expect(missingUserRes.status).toHaveBeenCalledWith(404);
  });

  test('updateUser applies changes and logs activity', async () => {
    userService.updateUser.mockResolvedValue({ id: 'u3', company_id: 3, email: 'u3@test.com' } as any);
    const req = createMockRequest({ params: { userId: 'u3' }, body: { name: 'User' } });
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.updateUser(req, res);

    expect(userService.updateUser).toHaveBeenCalledWith('u3', { name: 'User' });
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_updated',
      user_id: 'u3'
    }));
  });

  test('approveUser validates id, handles missing user, and logs activity', async () => {
    const missingIdReq = createMockRequest({ params: {} });
    const missingIdRes = createMockResponse();
    await controller.approveUser(missingIdReq, missingIdRes);
    expect(missingIdRes.status).toHaveBeenCalledWith(400);

    userService.updateUser.mockResolvedValue(null);
    const missingReq = createMockRequest({ params: { userId: 'u4' } });
    const missingRes = createMockResponse();
    await controller.approveUser(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);

    userService.updateUser.mockResolvedValue({ id: 'u4', company_id: 2, email: 'u4@test.com' } as any);
    const req = createMockRequest({ params: { userId: 'u4' } });
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();
    await controller.approveUser(req, res);
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_approved',
      user_id: 'u4'
    }));
  });

  test('getPendingUsers returns data', async () => {
    userService.getPendingUsers.mockResolvedValue([{ id: 'u5' }]);
    const res = createMockResponse();

    await controller.getPendingUsers(createMockRequest(), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('updateLastActivity validates id and calls service', async () => {
    const missingReq = createMockRequest({ params: {} });
    const missingRes = createMockResponse();
    await controller.updateLastActivity(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    const req = createMockRequest({ params: { userId: 'u6' } });
    const res = createMockResponse();
    await controller.updateLastActivity(req, res);
    expect(userService.updateLastActivity).toHaveBeenCalledWith('u6');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

