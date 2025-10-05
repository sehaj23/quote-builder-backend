import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const response: ApiResponse = {
    success: false,
    error: process.env['NODE_ENV'] === 'development' 
      ? error.message 
      : 'An internal server error occurred'
  };

  res.status(500).json(response);
};

// 404 Not Found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.url} not found`
  };

  res.status(404).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};