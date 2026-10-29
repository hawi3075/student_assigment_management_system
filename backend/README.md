# UniTask — Backend

Express.js + TypeScript REST API server with Neon PostgreSQL (or in-memory fallback).

## Structure

```
backend/
├── server.ts               # Entry point — Express app setup
├── neon.ts                 # Neon platform config
├── migrations/             # SQL schema migrations
├── seeds/                  # Database seed data
├── tests/                  # Backend integration tests
└── src/
    ├── config/
    │   └── database.ts     # DB connection, memory store, migrations
    ├── controllers/        # Route handler logic
    ├── middleware/
    │   ├── auth.ts         # JWT authentication & role guards
    │   └── upload.ts       # Multer file upload config
    ├── routes/             # Express router definitions
    └── swagger.ts          # OpenAPI spec
```

## Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
npm install
npm run dev
```

Server starts on `http://localhost:3000` by default.
