import { Injectable } from '@nestjs/common';

// The openid-client package doesn't always export a Passport-compatible Strategy in all
// environments. Only load and wire the real strategy when an OIDC issuer URL is
// configured. Otherwise export a harmless injectable so app bootstrap doesn't fail.

const issuerUrl = process.env.OIDC_ISSUER_URL;

let OidcStrategyFactory: any;

if (issuerUrl) {
  // Use require to avoid static imports that may break when the package shape differs.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Issuer, Strategy: OIDCStrategy } = require('openid-client');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PassportStrategy } = require('@nestjs/passport');

  if (!OIDCStrategy) {
    // openid-client does not provide a passport Strategy in this environment/version.
    @Injectable()
    class DummyOidcStrategy {}
    OidcStrategyFactory = DummyOidcStrategy;
  } else {
    @Injectable()
    class RealOidcStrategy extends (PassportStrategy as any)(OIDCStrategy, 'oidc') {
      constructor() {
        // Discovering from issuer might be preferred, but we construct a minimal Issuer here.
        const issuer = new Issuer({ issuer: issuerUrl } as any);
        const client = new issuer.Client({
          client_id: process.env.OAUTH2_CLIENT_ID || '',
          client_secret: process.env.OAUTH2_CLIENT_SECRET || '',
          redirect_uris: [process.env.OAUTH2_CALLBACK_URL || ''],
          response_types: ['code'],
        });
        super({ client });
      }
    }

    OidcStrategyFactory = RealOidcStrategy;
  }
} else {
  @Injectable()
  class DummyOidcStrategy {}
  OidcStrategyFactory = DummyOidcStrategy;
}

export { OidcStrategyFactory };
