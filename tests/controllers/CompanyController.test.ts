import { jest } from '@jest/globals';
import type { Request } from 'express';
import { CompanyController } from '../../src/controllers/CompanyController.js';
import type { CompanyService } from '../../src/services/CompanyService.js';
import type { Company } from '../../src/types/index.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 1,
  name: 'Test Company',
  ...overrides
});
const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: any;

  beforeEach(() => {
    service = {
      getAllCompanies: createAsyncMock(),
      getCompanyById: createAsyncMock(),
      createCompany: createAsyncMock(),
      updateCompany: createAsyncMock(),
      deleteCompany: createAsyncMock(),
      getCompanyStats: createAsyncMock(),
      incrementQuoteNumber: createAsyncMock(),
      getCompanyAnalytics: createAsyncMock()
    };

    controller = new CompanyController(service as unknown as CompanyService);
  });

  test('getAllCompanies responds with data', async () => {
    service.getAllCompanies.mockResolvedValue([{ id: 1, name: 'Acme' }]);
    const res = createMockResponse();

    await controller.getAllCompanies(createMockRequest(), res);

    expect(service.getAllCompanies).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [{ id: 1, name: 'Acme' }]
    }));
  });

  test('getCompanyById validates id', async () => {
    const req = createMockRequest({ params: { id: 'abc' } });
    const res = createMockResponse();

    await controller.getCompanyById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getCompanyById returns company', async () => {
    service.getCompanyById.mockResolvedValue(makeCompany({ id: 5 }));
    const req = createMockRequest({ params: { id: '5' } });
    const res = createMockResponse();

    await controller.getCompanyById(req, res);

    expect(service.getCompanyById).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createCompany validates body', async () => {
    const req = createMockRequest({ body: null }) as Request;
    const res = createMockResponse();

    await controller.createCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createCompany persists data', async () => {
    service.createCompany.mockResolvedValue({ id: 2, company: { name: 'New Co' } } as any);
    const req = createMockRequest({ body: { name: 'New Co' } });
    const res = createMockResponse();

    await controller.createCompany(req, res);

    expect(service.createCompany).toHaveBeenCalledWith({ name: 'New Co' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateCompany validates id', async () => {
    const req = createMockRequest({ params: { id: 'NaN' } });
    const res = createMockResponse();

    await controller.updateCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCompany validates body', async () => {
    const req = createMockRequest({ params: { id: '1' }, body: null }) as Request;
    const res = createMockResponse();

    await controller.updateCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCompany passes data to service', async () => {
    service.updateCompany.mockResolvedValue({ id: 1, name: 'Updated' } as any);
    const req = createMockRequest({ params: { id: '1' }, body: { name: 'Updated' } });
    const res = createMockResponse();

    await controller.updateCompany(req, res);

    expect(service.updateCompany).toHaveBeenCalledWith(1, { name: 'Updated' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deleteCompany validates id', async () => {
    const req = createMockRequest({ params: { id: 'bad' } });
    const res = createMockResponse();

    await controller.deleteCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCompany succeeds', async () => {
    const req = createMockRequest({ params: { id: '3' } });
    const res = createMockResponse();

    await controller.deleteCompany(req, res);

    expect(service.deleteCompany).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getCompanyStats returns stats', async () => {
    service.getCompanyStats.mockResolvedValue({ total: 10 } as any);
    const res = createMockResponse();

    await controller.getCompanyStats(createMockRequest(), res);

    expect(service.getCompanyStats).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('incrementQuoteNumber validates id', async () => {
    const req = createMockRequest({ params: { id: 'bad' } });
    const res = createMockResponse();

    await controller.incrementQuoteNumber(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('incrementQuoteNumber returns next value', async () => {
    service.incrementQuoteNumber.mockResolvedValue(42 as any);
    const req = createMockRequest({ params: { id: '7' } });
    const res = createMockResponse();

    await controller.incrementQuoteNumber(req, res);

    expect(service.incrementQuoteNumber).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { nextQuoteNumber: 42 }
    }));
  });

  test('getCompanyAnalytics validates id', async () => {
    const req = createMockRequest({ params: { id: 'bad' } });
    const res = createMockResponse();

    await controller.getCompanyAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getCompanyAnalytics returns analytics', async () => {
    service.getCompanyAnalytics.mockResolvedValue({ revenue: 1000 } as any);
    const req = createMockRequest({ params: { id: '9' } });
    const res = createMockResponse();

    await controller.getCompanyAnalytics(req, res);

    expect(service.getCompanyAnalytics).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

