# Tool Maintenance System - Backend API

Backend API server for the Tool Maintenance System built with Node.js, Express, TypeScript, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Language**: TypeScript 5.x
- **Authentication**: JWT (jsonwebtoken, bcrypt)
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn
- PostgreSQL 14+
- Git

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up Prisma:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Seed database (optional):
```bash
npm run prisma:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the PORT specified in .env).

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Prisma schema
│   ├── migrations/      # Database migrations
│   └── seeds/           # Seed data scripts
├── tests/               # Test files
├── .env.example         # Environment variables template
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## API Documentation

API documentation will be available at `/api/docs` (Swagger/OpenAPI - to be implemented).

## Environment Variables

See `.env.example` for all required environment variables.

## Database

This project uses Prisma ORM. Database schema is defined in `prisma/schema.prisma`.

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Follow the coding style enforced by ESLint and Prettier
2. Write tests for new features
3. Update documentation as needed
4. Follow the commit message conventions

## License

ISC

