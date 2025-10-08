import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OauthStrategy extends PassportStrategy(Strategy, 'oauth2') {
  constructor() {
    super({
      authorizationURL: process.env.OAUTH2_AUTH_URL || '',
      tokenURL: process.env.OAUTH2_TOKEN_URL || '',
      clientID: process.env.OAUTH2_CLIENT_ID || '',
      clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
      callbackURL: process.env.OAUTH2_CALLBACK_URL || ''
    });
  }
  validate(accessToken: string) { return { accessToken }; }
}
