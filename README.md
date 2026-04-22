# Ayanfe Clothings Ecommerce Platform

A full-stack ecommerce MVP for Ayanfe Clothings with a premium storefront, secure backend API, MongoDB persistence, and local development setup.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB (Mongoose)
- Security middleware: Helmet, CORS restrictions, rate limiting, request sanitization, JWT auth


## Features Implemented

- Product catalog API with filtering/search/sort support
- JWT authentication (register, login, profile)
- User cart API (add/update/remove/clear)
- Order creation API with stock checks and inventory updates
- Admin product and order management endpoints
- Responsive premium storefront UI with motion
- Frontend integration with live API and fallback catalog mode

## Security Baseline

- `helmet` for secure HTTP headers
- `express-rate-limit` for global and auth-specific limits
- `express-mongo-sanitize` to reduce NoSQL injection risks
- JWT-based route protection
- CORS allowlist via `FRONTEND_URL`
- Body size limit on JSON payloads

## Environment Setup

Update `backend/.env` to point at a local MongoDB instance:

- Set a strong `JWT_SECRET`
- Keep `MONGO_URI=mongodb://127.0.0.1:27017/ayanfe_clothings` for local testing

## Run Locally

Backend:

```bash
cd backend
npm i
npm run seed:products
npm run dev
```

Frontend:

```bash
cd vite-project
npm i
npm run dev
```

Backend tests:

```bash
cd backend
npm test
```

## Run Locally

Before starting the backend, make sure MongoDB is running locally on port 27017.

Frontend: `http://localhost:5173`
Backend API: `http://localhost:5000`

## Important API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `POST /api/cart`
- `GET /api/cart`
- `POST /api/orders`
- `GET /api/orders/mine`

Admin routes require an authenticated user with role `admin`.

## Next Recommended Steps

- Add payment gateway integration (Paystack/Stripe)
- Add image upload + CDN for product assets
- Add audit logging + structured logs
- Add API tests and frontend E2E tests
- Add CI/CD deployment to cloud (Render/Fly/railway + managed Mongo)
