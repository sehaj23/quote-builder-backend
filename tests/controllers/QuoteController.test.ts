const createAsyncMock = () => jest.fn<(...args: any[]) => Promise<any>>();
import { jest } from '@jest/globals';
import { QuoteController } from '../../src/controllers/QuoteController.js';
import type { QuoteService } from '../../src/services/QuoteService.js';
import type { ActivityService } from '../../src/services/ActivityService.js';
import { createMockRequest, createMockResponse } from '../utils/mockExpress.js';

describe('QuoteController', () => {
  let controller: QuoteController;
  let quoteService: any;
  let activityService: any;

  beforeEach(() => {
    quoteService = {
      getQuotesByCompanyPaginated: createAsyncMock(),
      getQuoteById: createAsyncMock(),
      createQuote: createAsyncMock(),
      updateQuote: createAsyncMock(),
      deleteQuote: createAsyncMock(),
      searchQuotes: createAsyncMock(),
      duplicateQuote: createAsyncMock(),
      updateQuoteStatus: createAsyncMock()
    };

    activityService = {
      logActivity: createAsyncMock()
    };

    controller = new QuoteController(
      quoteService as unknown as QuoteService,
      activityService as unknown as ActivityService
    );
  });

  test('getQuotesByCompany validates company id', async () => {
    const req = createMockRequest({ params: { companyId: 'bad' } });
    const res = createMockResponse();

    await controller.getQuotesByCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getQuotesByCompany validates pagination bounds', async () => {
    const req = createMockRequest({
      params: { companyId: '1' },
      query: { page: '0', pageSize: '10' }
    });
    const res = createMockResponse();

    await controller.getQuotesByCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getQuotesByCompany returns quotes', async () => {
    quoteService.getQuotesByCompanyPaginated.mockResolvedValue({
      quotes: [{ id: 1 }],
      totalCount: 1
    });
    const req = createMockRequest({
      params: { companyId: '2' },
      query: { page: '1', pageSize: '10', search: 'a', status: 'draft', tier: 'economy' }
    });
    const res = createMockResponse();

    await controller.getQuotesByCompany(req, res);

    expect(quoteService.getQuotesByCompanyPaginated).toHaveBeenCalledWith(
      2, 1, 10, { search: 'a', status: 'draft', tier: 'economy' }
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getQuoteById validates id and handles missing quote', async () => {
    const badReq = createMockRequest({ params: { id: 'NaN' } });
    const badRes = createMockResponse();
    await controller.getQuoteById(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    quoteService.getQuoteById.mockResolvedValue(null);
    const missingReq = createMockRequest({ params: { id: '5' } });
    const missingRes = createMockResponse();
    await controller.getQuoteById(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });

  test('getQuoteById returns quote data', async () => {
    quoteService.getQuoteById.mockResolvedValue({ quote: { id: 6 } } as any);
    const req = createMockRequest({ params: { id: '6' } });
    const res = createMockResponse();

    await controller.getQuoteById(req, res);

    expect(quoteService.getQuoteById).toHaveBeenCalledWith(6);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('createQuote persists data and logs activity when user present', async () => {
    quoteService.createQuote.mockResolvedValue({ id: 9, quote: { quote: { quote_number: 'Q-1' } } } as any);
    const req = createMockRequest({ body: { company_id: 1 } });
    (req as any).user = { id: 'user-1' };
    req.get.mockReturnValue('agent');
    const res = createMockResponse();

    await controller.createQuote(req, res);

    expect(quoteService.createQuote).toHaveBeenCalledWith({ company_id: 1 });
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'quote_created',
      user_id: 'user-1'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateQuote validates id and handles not found', async () => {
    const badReq = createMockRequest({ params: { id: 'bad' } });
    const badRes = createMockResponse();
    await controller.updateQuote(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    quoteService.updateQuote.mockResolvedValue(null);
    const missingReq = createMockRequest({ params: { id: '3' }, body: {} });
    const missingRes = createMockResponse();
    await controller.updateQuote(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });

  test('updateQuote saves data and logs activity', async () => {
    quoteService.updateQuote.mockResolvedValue({ quote: { id: 7, quote_number: 'Q-7' } } as any);
    const req = createMockRequest({ params: { id: '7' }, body: { status: 'sent' } });
    (req as any).user = { id: 'user-2' };
    req.get.mockReturnValue('');
    const res = createMockResponse();

    await controller.updateQuote(req, res);

    expect(quoteService.updateQuote).toHaveBeenCalledWith(7, { status: 'sent' });
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'quote_updated',
      resource_id: 7
    }));
  });

  test('deleteQuote validates id and handles missing rows', async () => {
    const badReq = createMockRequest({ params: { id: 'bad' } });
    const badRes = createMockResponse();
    await controller.deleteQuote(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    quoteService.getQuoteById.mockResolvedValue({ quote: { company_id: 1 } } as any);
    quoteService.deleteQuote.mockResolvedValue(false);
    const missingReq = createMockRequest({ params: { id: '4' } });
    const missingRes = createMockResponse();
    await controller.deleteQuote(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });

  test('deleteQuote removes quote and logs activity', async () => {
    quoteService.getQuoteById.mockResolvedValue({ quote: { company_id: 2 } } as any);
    quoteService.deleteQuote.mockResolvedValue(true);
    const req = createMockRequest({ params: { id: '4' }, body: {} });
    (req as any).user = { id: 'user-3' };
    req.get.mockReturnValue(undefined);
    const res = createMockResponse();

    await controller.deleteQuote(req, res);

    expect(quoteService.deleteQuote).toHaveBeenCalledWith(4);
    expect(activityService.logActivity).toHaveBeenCalledWith(expect.objectContaining({
      action: 'quote_deleted',
      resource_id: 4
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('searchQuotes validates company id and query', async () => {
    const badReq = createMockRequest({ params: { companyId: 'bad' } });
    const badRes = createMockResponse();
    await controller.searchQuotes(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    const noQueryReq = createMockRequest({ params: { companyId: '1' }, query: {} });
    const noQueryRes = createMockResponse();
    await controller.searchQuotes(noQueryReq, noQueryRes);
    expect(noQueryRes.status).toHaveBeenCalledWith(400);
  });

  test('searchQuotes returns matches', async () => {
    quoteService.searchQuotes.mockResolvedValue([{ id: 1 }]);
    const req = createMockRequest({ params: { companyId: '1' }, query: { query: 'kitchen' } });
    const res = createMockResponse();

    await controller.searchQuotes(req, res);

    expect(quoteService.searchQuotes).toHaveBeenCalledWith(1, 'kitchen');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('duplicateQuote validates id', async () => {
    const req = createMockRequest({ params: { id: 'bad' }, body: {} });
    const res = createMockResponse();

    await controller.duplicateQuote(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('duplicateQuote returns new quote', async () => {
    quoteService.duplicateQuote.mockResolvedValue(99);
    const req = createMockRequest({ params: { id: '5' }, body: { newTier: 'luxury' } });
    const res = createMockResponse();

    await controller.duplicateQuote(req, res);

    expect(quoteService.duplicateQuote).toHaveBeenCalledWith(5, 'luxury');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateQuoteStatus validates input', async () => {
    const badReq = createMockRequest({ params: { id: 'bad' } });
    const badRes = createMockResponse();
    await controller.updateQuoteStatus(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    const noStatusReq = createMockRequest({ params: { id: '1' }, body: {} });
    const noStatusRes = createMockResponse();
    await controller.updateQuoteStatus(noStatusReq, noStatusRes);
    expect(noStatusRes.status).toHaveBeenCalledWith(400);
  });

  test('updateQuoteStatus handles missing quote', async () => {
    quoteService.updateQuoteStatus.mockResolvedValue(false);
    const req = createMockRequest({ params: { id: '2' }, body: { status: 'sent' } });
    const res = createMockResponse();

    await controller.updateQuoteStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateQuoteStatus returns success', async () => {
    quoteService.updateQuoteStatus.mockResolvedValue(true);
    const req = createMockRequest({ params: { id: '2' }, body: { status: 'approved' } });
    const res = createMockResponse();

    await controller.updateQuoteStatus(req, res);

    expect(quoteService.updateQuoteStatus).toHaveBeenCalledWith(2, 'approved');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('rejectQuote validates id and handles missing quote', async () => {
    const badReq = createMockRequest({ params: { id: 'bad' } });
    const badRes = createMockResponse();
    await controller.rejectQuote(badReq, badRes);
    expect(badRes.status).toHaveBeenCalledWith(400);

    quoteService.updateQuoteStatus.mockResolvedValue(false);
    const missingReq = createMockRequest({ params: { id: '8' } });
    const missingRes = createMockResponse();
    await controller.rejectQuote(missingReq, missingRes);
    expect(missingRes.status).toHaveBeenCalledWith(404);
  });

  test('rejectQuote updates status to rejected', async () => {
    quoteService.updateQuoteStatus.mockResolvedValue(true);
    const req = createMockRequest({ params: { id: '8' } });
    const res = createMockResponse();

    await controller.rejectQuote(req, res);

    expect(quoteService.updateQuoteStatus).toHaveBeenCalledWith(8, 'rejected');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { id: 8, status: 'rejected' }
    }));
  });
});

