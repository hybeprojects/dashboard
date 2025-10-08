import { Issuer, Strategy as OIDCStrategy, Client } from 'openid-client';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OidcStrategyFactory extends PassportStrategy(OIDCStrategy, 'oidc') {
  constructor() {
    const issuerUrl = process.env.OIDC_ISSUER_URL;
    if (!issuerUrl) {
      // Initialize a dummy client to keep app booting when OIDC is not configured.
      super({ client: new Client({ client_id: 'none', client_secret: 'none', redirect_uris: [], response_types: ['code'] }) } as any);
      return;
    }
    // In production, discover from issuer and configure a real client.
    const issuer = new Issuer({ issuer: issuerUrl } as any);
    const client = new issuer.Client({
      client_id: process.env.OAUTH2_CLIENT_ID || '',
      client_secret: process.env.OAUTH2_CLIENT_SECRET || '',
      redirect_uris: [process.env.OAUTH2_CALLBACK_URL || ''],
      response_types: ['code']
    });
    super({ client });
  }
}
