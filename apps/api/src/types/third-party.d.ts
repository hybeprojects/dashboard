declare module 'speakeasy';

declare module 'passport-jwt';

declare module 'passport-oauth2';

declare module 'openid-client' {
  export const Issuer: any;
  export const Strategy: any;
  export const Client: any;
  const _default: any;
  export default _default;
}
