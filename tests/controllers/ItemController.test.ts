import { jest } from '@jest/globals';
import { ItemController } from '../../src/controllers/ItemController.js';
import type { ItemService } from '../../src/services/ItemService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('ItemController', () => {
  let controller: ItemController;
  let service: any;

  beforeEach(() => {
    service = {
      getItemsByCompanyPaginated: createAsyncMock(),
      getItemById: createAsyncMock(),
      createItem: createAsyncMock(),
      updateItem: createAsyncMock(),
      deleteItem: createAsyncMock(),
      searchItems: createAsyncMock(),
      getItemsByCategory: createAsyncMock(),
      getCategories: createAsyncMock()
    };

    controller = new ItemController(service as unknown as ItemService);
  });

  test('getItemsByCompany validates company id', async () => {
    const req = createMockRequest({ params: { companyId: 'bad' } });
    const res = createMockResponse();

    await controller.getItemsByCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getItemsByCompany enforces pagination bounds', async () => {
    const req = createMockRequest({
      params: { companyId: '1' },
      query: { page: '0', pageSize: '10' }
    });
    const res = createMockResponse();

    await controller.getItemsByCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getItemsByCompany returns data', async () => {
    service.getItemsByCompanyPaginated.mockResolvedValue({
      items: [{ id: 1 }],
      totalCount: 1
    });
    const req = createMockRequest({
      params: { companyId: '2' },
      query: { page: '1', pageSize: '10', search: 'chair', category: 'living' }
    });
    const res = createMockResponse();

    await controller.getItemsByCompany(req, res);

    expect(service.getItemsByCompanyPaginated).toHaveBeenCalledWith(
      2,
      1,
      10,
      { search: 'chair', category: 'living' }
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getItemById validates id', async () => {
    const req = createMockRequest({ params: { id: 'oops' } });
    const res = createMockResponse();

    await controller.getItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getItemById handles missing item', async () => {
    service.getItemById.mockResolvedValue(null);
    const req = createMockRequest({ params: { id: '3' } });
    const res = createMockResponse();

    await controller.getItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createItem rejects invalid company', async () => {
    const req = createMockRequest({ params: { companyId: 'NaN' } });
    const res = createMockResponse();

    await controller.createItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createItem persists item for company', async () => {
    service.createItem.mockResolvedValue({ id: 5 } as any);
    const req = createMockRequest({
      params: { companyId: '4' },
      body: { name: 'Lamp' }
    });
    const res = createMockResponse();

    await controller.createItem(req, res);

    expect(service.createItem).toHaveBeenCalledWith(expect.objectContaining({
      company_id: 4,
      name: 'Lamp'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateItem validates id and handles missing item', async () => {
    const badReq = createMockRequest({ params: { id: 'bad' } });
    const res = createMockResponse();

    await controller.updateItem(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);

    service.updateItem.mockResolvedValue(null);
    const notFoundReq = createMockRequest({ params: { id: '10' }, body: {} });
    const res2 = createMockResponse();
    await controller.updateItem(notFoundReq, res2);
    expect(res2.status).toHaveBeenCalledWith(404);
  });

  test('updateItem saves changes', async () => {
    service.updateItem.mockResolvedValue({ id: 6 });
    const req = createMockRequest({ params: { id: '6' }, body: { name: 'Desk' } });
    const res = createMockResponse();

    await controller.updateItem(req, res);

    expect(service.updateItem).toHaveBeenCalledWith(6, { name: 'Desk' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('deleteItem validates id and handles missing rows', async () => {
    const badReq = createMockRequest({ params: { id: 'oops' } });
    const res = createMockResponse();
    await controller.deleteItem(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);

    service.deleteItem.mockResolvedValue(false);
    const missingReq = createMockRequest({ params: { id: '11' } });
    const res2 = createMockResponse();
    await controller.deleteItem(missingReq, res2);
    expect(res2.status).toHaveBeenCalledWith(404);
  });

  test('deleteItem confirms deletion', async () => {
    service.deleteItem.mockResolvedValue(true);
    const req = createMockRequest({ params: { id: '12' } });
    const res = createMockResponse();

    await controller.deleteItem(req, res);

    expect(service.deleteItem).toHaveBeenCalledWith(12);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('searchItems validates input and queries service', async () => {
    const reqMissingCompany = createMockRequest({ params: { companyId: 'NaN' } });
    const resMissing = createMockResponse();
    await controller.searchItems(reqMissingCompany, resMissing);
    expect(resMissing.status).toHaveBeenCalledWith(400);

    const reqMissingQuery = createMockRequest({ params: { companyId: '1' }, query: {} });
    const resMissingQuery = createMockResponse();
    await controller.searchItems(reqMissingQuery, resMissingQuery);
    expect(resMissingQuery.status).toHaveBeenCalledWith(400);

    service.searchItems.mockResolvedValue([{ id: 1 }]);
    const req = createMockRequest({ params: { companyId: '1' }, query: { query: 'lamp' } });
    const res = createMockResponse();
    await controller.searchItems(req, res);
    expect(service.searchItems).toHaveBeenCalledWith(1, 'lamp');
  });

  test('getItemsByCategory validates company id', async () => {
    const req = createMockRequest({ params: { companyId: 'bad' } });
    const res = createMockResponse();

    await controller.getItemsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getItemsByCategory returns list', async () => {
    service.getItemsByCategory.mockResolvedValue([{ id: 1 }] as any);
    const req = createMockRequest({ params: { companyId: '2', category: 'decor' } });
    const res = createMockResponse();

    await controller.getItemsByCategory(req, res);

    expect(service.getItemsByCategory).toHaveBeenCalledWith(2, 'decor');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getCategories validates company id and responds', async () => {
    const badReq = createMockRequest({ params: { companyId: 'oops' } });
    const resBad = createMockResponse();
    await controller.getCategories(badReq, resBad);
    expect(resBad.status).toHaveBeenCalledWith(400);

    service.getCategories.mockResolvedValue(['decor']);
    const req = createMockRequest({ params: { companyId: '3' } });
    const res = createMockResponse();
    await controller.getCategories(req, res);
    expect(service.getCategories).toHaveBeenCalledWith(3);
  });

  test('getMyCategories ensures authenticated company', async () => {
    const reqNoUser: any = createMockRequest();
    const resNoUser = createMockResponse();
    await controller.getMyCategories(reqNoUser, resNoUser);
    expect(resNoUser.status).toHaveBeenCalledWith(400);

    service.getCategories.mockResolvedValue(['lighting']);
    const req = createMockRequest();
    (req as any).user = { company_id: 8 };
    const res = createMockResponse();

    await controller.getMyCategories(req, res);

    expect(service.getCategories).toHaveBeenCalledWith(8);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

