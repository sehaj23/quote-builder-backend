import { jest } from '@jest/globals';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { AuthController } from '../../src/controllers/AuthController.js';
import { UserService } from '../../src/services/UserService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

jest.mock('../../src/services/CompanyService.js', () => {
  const instance = {
    createCompany: jest.fn(),
    deleteCompany: jest.fn()
  };
  const MockCompanyService = jest.fn().mockImplementation(() => instance);
  return {
    CompanyService: MockCompanyService,
    __mockInstance: instance
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt-token')
}));

const companyServiceModule = jest.requireMock('../../src/services/CompanyService.js') as {
  __mockInstance: {
    createCompany: jest.Mock;
    deleteCompany: jest.Mock;
  };
};
const companyServiceMockInstance = companyServiceModule.__mockInstance as {
  createCompany: jest.MockedFunction<(payload: any) => Promise<any>>;
  deleteCompany: jest.MockedFunction<(companyId: number) => Promise<any>>;
};

const mockValidationResult = validationResult as unknown as jest.Mock;
const userServiceMock = UserService as unknown as {
  findByEmail: jest.MockedFunction<(email: string) => Promise<any>>;
  create: jest.MockedFunction<(payload: any) => Promise<any>>;
  updateLastActivity: jest.MockedFunction<(id: string) => Promise<any>>;
  deleteUser: jest.MockedFunction<(id: string) => Promise<any>>;
};

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    userServiceMock.findByEmail.mockReset();
    userServiceMock.create.mockReset();
    userServiceMock.updateLastActivity.mockReset();
    userServiceMock.deleteUser.mockReset();
    companyServiceMockInstance.createCompany.mockReset();
    companyServiceMockInstance.deleteCompany.mockReset();
  });

  test('signup rejects validation errors', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid' }]
    });
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    await AuthController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('signup rejects existing users', async () => {
    userServiceMock.findByEmail.mockResolvedValue({ id: 'existing' });
    const req = createMockRequest({ body: { email: 'test@example.com', password: 'Passw0rd!', firstName: 'A', lastName: 'B' } });
    const res = createMockResponse();

    await AuthController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('signup creates user when valid', async () => {
    userServiceMock.findByEmail.mockResolvedValue(null);
    userServiceMock.create.mockResolvedValue({ id: 'new-user', email: 'test@example.com', firstName: 'Test', lastName: 'User', isApproved: false });
    const req = createMockRequest({ body: { email: 'test@example.com', password: 'Passw0rd!', firstName: 'Test', lastName: 'User' } });
    const res = createMockResponse();

    await AuthController.signup(req, res);

    expect(userServiceMock.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('login validates input and user existence', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => []
    });
    const invalidReq = createMockRequest({ body: {} });
    const invalidRes = createMockResponse();
    await AuthController.login(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    userServiceMock.findByEmail.mockResolvedValue(null);
    const missingReq = createMockRequest({ body: { email: 'user@example.com', password: 'pass' } });
    const missingRes = createMockResponse();
    await AuthController.login(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });

  test('login rejects unapproved user', async () => {
    userServiceMock.findByEmail.mockResolvedValue({ id: 'user', isApproved: false });
    const req = createMockRequest({ body: { email: 'user@example.com', password: 'pass' } });
    const res = createMockResponse();

    await AuthController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('login succeeds for approved user', async () => {
    userServiceMock.findByEmail.mockResolvedValue({
      id: 'user',
      email: 'user@example.com',
      isApproved: true
    });
    const req = createMockRequest({ body: { email: 'user@example.com', password: 'pass' } });
    const res = createMockResponse();

    await AuthController.login(req, res);

    expect(userServiceMock.updateLastActivity).toHaveBeenCalledWith('user');
    expect(jwt.sign).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getUserInfo validates email and handles missing user', async () => {
    const missingReq = createMockRequest({ params: {} });
    const missingRes = createMockResponse();
    await AuthController.getUserInfo(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(400);

    userServiceMock.findByEmail.mockResolvedValue(null);
    const req = createMockRequest({ params: { email: 'missing@example.com' } });
    const res = createMockResponse();
    await AuthController.getUserInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('forgotPassword validates user existence', async () => {
    userServiceMock.findByEmail.mockResolvedValue(null);
    const req = createMockRequest({ body: { email: 'missing@example.com' } });
    const res = createMockResponse();

    await AuthController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('signupWithCompany validates and rejects existing users', async () => {
    mockValidationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => []
    });
    const invalidReq = createMockRequest({ body: {} });
    const invalidRes = createMockResponse();
    await AuthController.signupWithCompany(invalidReq, invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    mockValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    userServiceMock.findByEmail.mockResolvedValue({ id: 'existing' });
    const req = createMockRequest({
      body: {
        email: 'owner@example.com',
        password: 'Passw0rd!',
        firstName: 'Owner',
        lastName: 'User',
        companyName: 'My Co'
      }
    });
    const res = createMockResponse();
    await AuthController.signupWithCompany(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('signupWithCompany creates company and user', async () => {
    userServiceMock.findByEmail.mockResolvedValue(null);
    companyServiceMockInstance.createCompany.mockResolvedValue({ id: 10 });
    userServiceMock.create.mockResolvedValue({
      id: 'user',
      email: 'owner@example.com',
      isApproved: true,
      company_id: 10
    });
    const req = createMockRequest({
      body: {
        email: 'owner@example.com',
        password: 'Passw0rd!',
        firstName: 'Owner',
        lastName: 'User',
        companyName: 'My Co'
      }
    });
    const res = createMockResponse();

    await AuthController.signupWithCompany(req, res);

    expect(companyServiceMockInstance.createCompany).toHaveBeenCalledWith({
      name: 'My Co',
      address: undefined,
      email: undefined,
      phone: undefined
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('validateSession ensures auth context user exists', async () => {
    const missingReq = createMockRequest();
    const missingRes = createMockResponse();
    await AuthController.validateSession(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(401);
  });

  test('validateSession validates stored user record', async () => {
    const req: any = createMockRequest();
    req.user = { email: 'user@example.com' };
    userServiceMock.findByEmail.mockResolvedValue(null);
    const res = createMockResponse();
    await AuthController.validateSession(req, res);
    expect(res.status).toHaveBeenCalledWith(401);

    userServiceMock.findByEmail.mockResolvedValue({ id: 'user', email: 'user@example.com', isApproved: true });
    const successRes = createMockResponse();
    await AuthController.validateSession(req, successRes);
    expect(userServiceMock.updateLastActivity).toHaveBeenCalledWith('user');
    expect(successRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

