import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const hasOauthConfig = !!process.env.OAUTH2_AUTH_URL;

let OauthStrategy: any;

if (!hasOauthConfig) {
  @Injectable()
  class DummyOauthStrategy {}
  OauthStrategy = DummyOauthStrategy;
} else {
  // Defensive require to support different module export shapes.
  const passportOauth = require('passport-oauth2');
  const OauthStrategyImpl = passportOauth.Strategy || passportOauth || undefined;

  @Injectable()
  class RealOauthStrategy extends (PassportStrategy as any)(OauthStrategyImpl || class {}, 'oauth2') {
    constructor() {
      super({
        authorizationURL: process.env.OAUTH2_AUTH_URL || '',
        tokenURL: process.env.OAUTH2_TOKEN_URL || '',
        clientID: process.env.OAUTH2_CLIENT_ID || '',
        clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
        callbackURL: process.env.OAUTH2_CALLBACK_URL || ''
      } as any);
    }
    validate(accessToken: string) { return { accessToken }; }
  }

  OauthStrategy = RealOauthStrategy;
}

export { OauthStrategy };
