import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization || (req.cookies && req.cookies['auth']);
    if (!auth) throw new UnauthorizedException('No authorization');
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    try {
      const payload = await this.jwt.verifyAsync(token);
      req.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
