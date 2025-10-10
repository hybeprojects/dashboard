# Fineract Wrapper Server (demo)

This is a small Express server that wraps Apache Fineract for demo purposes.

.env expected (use .env.example):

FINERACT_BASE_URL=http://localhost:8080/fineract-provider/api/v1
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password
JWT_SECRET=change_this
PORT=4000

Install and run:

npm --prefix server install
npm --prefix server run start

API endpoints:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/accounts
- POST /api/accounts
- POST /api/transfer
- GET /api/transactions
- GET /api/notifications

Socket.io endpoint: connect to server on the same port
