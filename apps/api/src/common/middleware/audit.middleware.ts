import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Persist to audit sink in production (e.g., DB or stream). Here we log to stdout.
    console.log('AUDIT', { path: req.path, method: req.method, ip: req.ip, time: new Date().toISOString() });
    next();
  }
}
