import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

// Load passport-jwt defensively to handle differing export shapes between versions.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const passportJwt = require('passport-jwt');
const ExtractJwt =
  passportJwt.ExtractJwt || passportJwt.extractJwt || (passportJwt && passportJwt.ExtractJwt);
const JwtStrategyImpl = passportJwt.Strategy || passportJwt;

@Injectable()
export class JwtStrategy extends (PassportStrategy as any)(JwtStrategyImpl || class {}) {
  constructor() {
    // If the real Strategy isn't available, construct with a noop to avoid runtime crash.
    const jwtFromRequest =
      (ExtractJwt &&
        ExtractJwt.fromAuthHeaderAsBearerToken &&
        ExtractJwt.fromAuthHeaderAsBearerToken()) ||
      (() => null);
    super({ jwtFromRequest, secretOrKey: process.env.JWT_SECRET || 'secret' } as any);
  }
  async validate(payload: any) {
    return { userId: payload?.sub, email: payload?.email };
  }
}
