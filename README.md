# QuoteBuilder Backend API

A TypeScript-based REST API service for the QuoteBuilder application, built with Express.js, MySQL, and following a clean architecture pattern.

## Architecture

The backend follows a layered architecture pattern:

```
Routes → Controllers → Services → Repositories → Database
```

### Project Structure

```
src/
├── config/           # Database configuration
├── controllers/      # HTTP request/response handling
├── middleware/       # Express middleware (validation, error handling)
├── repositories/     # Data access layer
├── routes/          # API route definitions  
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Features

- **TypeScript**: Full type safety and better developer experience
- **Clean Architecture**: Separation of concerns with proper layering
- **MySQL Database**: Robust relational database with proper indexing
- **Validation**: Request validation using express-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **CORS**: Cross-origin resource sharing support
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for request logging

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/stats` - Get company statistics

### Health Check
- `GET /health` - Service health check
- `GET /` - API information

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Docker (optional, for MySQL)

### Installation

1. **Clone and install dependencies:**
```bash
cd quotebuilder-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start MySQL (using Docker):**
```bash
docker run --name mysql-quotebuilder \
  -e MYSQL_ROOT_PASSWORD=dl4cl0621 \
  -p 3306:3306 \
  -d mysql:8.0
```

4. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=dl4cl0621
DB_NAME=quotebuilder_web
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:1420
```

## Database Schema

The application creates the following tables:

- **companies** - Company information
- **items** - Product/service items
- **quotes** - Quote headers
- **quote_lines** - Quote line items

All tables include proper foreign key relationships and indexes for performance.

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Success responses:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

## Development

### Adding New Features

1. **Create types** in `src/types/index.ts`
2. **Create repository** in `src/repositories/`
3. **Create service** in `src/services/`
4. **Create controller** in `src/controllers/`
5. **Create routes** in `src/routes/`
6. **Add validation** in `src/middleware/validation.ts`

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use proper error handling
- Add JSDoc comments for public methods
- Use meaningful variable names

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Ensure MySQL is running and accessible
4. Set production environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License