# Security Hardening Guide

This guide provides a checklist of security best practices for this repository.

## Environment Variables

- **`JWT_SECRET`**: This secret is used to sign and verify JSON Web Tokens. It is critical to keep this secret secure and to ensure it is not exposed in client-side code. This variable must be set in the production environment.
- **`PERSONAL_SCHEMA`**: This variable defines the database schema to be used. It should be set to a whitelisted value to prevent SQL injection attacks.
- **`DB_HOST`**, **`DB_PORT`**, **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`**: These variables are required for the server to connect to the database. They should be stored securely and not be hard-coded in the application.
- **`CLIENT_URL`**: This variable should be set to the URL of the client application to ensure that the CORS policy is correctly configured.

## Secret Rotation

- **`JWT_SECRET`**: The JWT secret should be rotated periodically to reduce the risk of a compromised secret being used to access the application. A rotation period of 90 days is recommended.

## Deployment Checklist

- [ ] Ensure that all environment variables are correctly configured in the production environment.
- [ ] Verify that the `NODE_ENV` environment variable is set to `production`.
- [ ] Confirm that debugging tools and verbose error messages are disabled in the production environment.
- [ ] Run `npm audit` to check for any new security vulnerabilities before deploying.
- [ ] Ensure that the application is running behind a firewall and that only necessary ports are exposed.
- [ ] Verify that the database is not publicly accessible and that all connections are encrypted.
- [ ] Ensure that the `helmet` and `express-rate-limit` middleware are enabled and properly configured.
- [ ] Verify that the `next.config.js` file is configured to fail builds on TypeScript and ESLint errors.
- [ ] Confirm that the CI/CD pipeline is configured to run tests and security checks on every build.