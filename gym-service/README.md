# Gym Service

This service is part of the Gym Management System, responsible for managing gyms, membership plans, and subscriptions.

## Features

- CRUD operations for gyms
- Manage membership plans
- Handle gym subscriptions
- Integration with RabbitMQ for async events
- Swagger API documentation
- Docker and docker-compose support

## Prerequisites

- Node.js 18+
- npm 9+
- Docker and Docker Compose
- PostgreSQL 15+
- RabbitMQ 3.12+

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd gym-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

### 4. Database Setup

#### Using Docker Compose (Recommended)

```bash
docker-compose up -d postgres
```

#### Manual Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

### 5. Start the Application

#### Development

```bash
# Start in watch mode
npm run start:dev
```

#### Production

```bash
# Build the application
npm run build

# Start the application
npm run start:prod
```

### 6. Using Docker

Build and start all services:

```bash
docker-compose up -d --build
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3001/api
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Application port | 3001 |
| NODE_ENV | Application environment | development |
| DATABASE_URL | PostgreSQL connection URL | - |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | JWT expiration time | 1d |
| RABBITMQ_URL | RabbitMQ connection URL | amqp://guest:guest@localhost:5672 |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000,http://localhost:3002 |

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Deployment

### Prisma Migrations

To apply migrations in production:

```bash
npx prisma migrate deploy
```

### Docker Deployment

Build and push the Docker image:

```bash
docker build -t your-username/gym-service:latest .
docker push your-username/gym-service:latest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
