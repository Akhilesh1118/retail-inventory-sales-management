import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {})
  });
}
