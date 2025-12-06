import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

export type MockResponse = Response & {
  status: jest.MockedFunction<Response['status']>;
  json: jest.MockedFunction<Response['json']>;
  send: jest.MockedFunction<Response['send']>;
  set: jest.MockedFunction<Response['set']>;
  sendStatus: jest.MockedFunction<Response['sendStatus']>;
  links: jest.MockedFunction<Response['links']>;
};

export type MockRequest<T = any> = Request<T> & {
  get: jest.MockedFunction<Request['get']>;
  user?: any;
};

type MockRequestOverrides<T> = Partial<MockRequest<T>> & Record<string, unknown>;

export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.locals = {};
  res.status = jest.fn().mockImplementation(() => res) as unknown as MockResponse['status'];
  res.json = jest.fn().mockImplementation(() => res) as unknown as MockResponse['json'];
  res.send = jest.fn().mockImplementation(() => res) as unknown as MockResponse['send'];
  res.set = jest.fn().mockImplementation(() => res) as unknown as MockResponse['set'];
  res.sendStatus = jest.fn().mockImplementation(() => res) as unknown as MockResponse['sendStatus'];
  res.links = jest.fn().mockImplementation(() => res) as unknown as MockResponse['links'];
  return res;
};

export const createMockRequest = <T = any>(overrides: MockRequestOverrides<T> = {}): MockRequest<T> => {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {},
    get: jest.fn().mockReturnValue(undefined) as unknown as MockRequest<T>['get'],
    ip: '127.0.0.1'
  } as Record<string, unknown>;

  Object.assign(req, overrides);

  return req as unknown as MockRequest<T>;
};

