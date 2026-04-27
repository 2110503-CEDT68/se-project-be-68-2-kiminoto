# 🚗 Car Rental Backend API

> RESTful API backend for the Car Rental booking platform — built with Express.js and MongoDB.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker](#docker)
  - [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [CI/CD](#-cicd)

---

## 🛠 Tech Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Runtime        | Node.js 20                                |
| Framework      | Express 5                                 |
| Database       | MongoDB (Mongoose 9)                      |
| Auth           | JWT (jsonwebtoken + bcryptjs)             |
| Docs           | Swagger (swagger-jsdoc + swagger-ui)      |
| Testing        | Jest + Supertest                          |
| CI/CD          | GitHub Actions                            |
| Deployment     | Docker / Vercel                           |

---

## 📂 Project Structure

```
├── api/                # Vercel serverless entry point
├── config/             # Database connection & env config
├── controllers/        # Route handler logic
│   ├── auth.js
│   ├── bookings.js
│   ├── carProviders.js
│   ├── profile.js
│   ├── reviews.js
│   └── votes.js
├── middleware/          # Auth middleware
├── models/             # Mongoose schemas
│   ├── Booking.js
│   ├── CarProvider.js
│   ├── Review.js
│   ├── User.js
│   └── Vote.js
├── routes/             # Express route definitions
├── testCase/           # Jest test suites
├── server.js           # Application entry point
├── Dockerfile          # Production container image
├── docker-compose.yml  # Full-stack orchestration
└── vercel.json         # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **MongoDB** (local instance or Atlas connection string)
- **Docker** & **Docker Compose** (optional, for containerised setup)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/2110503-CEDT68/se-project-be-68-2-kiminoto.git
   cd se-project-be-68-2-kiminoto
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your values (see [Environment Variables](#-environment-variables)).

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000` with hot-reload via Nodemon.

### Docker

Spin up the full stack (MongoDB + Backend + Frontend) with a single command:

```bash
# 1. Create your .env file
cp .env.example .env
# Edit .env with your secrets

# 2. Build and start all services
docker compose up --build -d

# 3. View logs
docker compose logs -f backend
```

| Service    | URL                      |
| ---------- | ------------------------ |
| Backend    | http://localhost:5000     |
| Frontend   | http://localhost:3000     |
| MongoDB    | mongodb://localhost:27017 |

To stop all services:

```bash
docker compose down
```

To also remove persisted data:

```bash
docker compose down -v
```

### Vercel Deployment

The project includes a `vercel.json` that routes all requests through `api/index.js`. To deploy:

1. Link the repo to a Vercel project.
2. Set the environment variables in the Vercel dashboard.
3. Deploy — Vercel will automatically use the `@vercel/node` builder.

---

## 🔐 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable              | Description                        | Example                              |
| --------------------- | ---------------------------------- | ------------------------------------ |
| `NODE_ENV`            | Environment mode                   | `production`                         |
| `PORT`                | Server port                        | `5000`                               |
| `MONGO_URI`           | MongoDB connection string          | `mongodb://mongodb:27017/dbname`     |
| `JWT_SECRET`          | Secret key for signing JWTs        | *(generate a strong random string)*  |
| `JWT_EXPIRE`          | JWT token expiry duration          | `30d`                                |
| `JWT_COOKIE_EXPIRE`   | Cookie expiry in days              | `30`                                 |
| `OPENROUTER_API_KEY`  | OpenRouter API key (LLM moderation)| *(your API key)*                     |

**Frontend-only** (used by `docker-compose.yml`):

| Variable           | Description            | Example                   |
| ------------------ | ---------------------- | ------------------------- |
| `NEXTAUTH_URL`     | NextAuth callback URL  | `http://localhost:3000`   |
| `NEXTAUTH_SECRET`  | NextAuth secret        | *(random string)*         |
| `AUTH_SECRET`      | Auth.js secret         | *(random string)*         |

---

## 📡 API Endpoints

Base URL: `/api/v1`

### Auth (`/auth`)
| Method | Endpoint       | Description            | Access  |
| ------ | -------------- | ---------------------- | ------- |
| POST   | `/register`    | Register a new user    | Public  |
| POST   | `/login`       | Log in & receive JWT   | Public  |
| GET    | `/me`          | Get current user       | Private |
| GET    | `/logout`      | Log out (clear cookie) | Private |

### Car Providers (`/car-providers`)
| Method | Endpoint       | Description              | Access       |
| ------ | -------------- | ------------------------ | ------------ |
| GET    | `/`            | List all car providers   | Public       |
| GET    | `/:id`         | Get a car provider       | Public       |
| POST   | `/`            | Create a car provider    | Admin        |
| PUT    | `/:id`         | Update a car provider    | Admin        |
| DELETE | `/:id`         | Delete a car provider    | Admin        |

### Bookings (`/bookings`)
| Method | Endpoint       | Description              | Access       |
| ------ | -------------- | ------------------------ | ------------ |
| GET    | `/`            | List bookings            | Private      |
| GET    | `/:id`         | Get a booking            | Private      |
| POST   | `/`            | Create a booking         | Private      |
| PUT    | `/:id`         | Update a booking         | Private      |
| DELETE | `/:id`         | Delete a booking         | Private      |

### Profile (`/profile`)
| Method | Endpoint       | Description              | Access       |
| ------ | -------------- | ------------------------ | ------------ |
| GET    | `/`            | Get user profile         | Private      |
| PUT    | `/`            | Update user profile      | Private      |

### Reviews & Votes

Reviews and votes are accessible as nested routes under car providers and bookings. See the Swagger documentation at `/api-docs` for full details.

> 📖 **Interactive API docs** are available at `http://localhost:5000/api-docs` when the server is running.

---

## 🧪 Testing

Tests are written with **Jest** and **Supertest**, located in the `testCase/` directory.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

---

## ⚙ CI/CD

GitHub Actions runs on every push and pull request to `main`:

1. **Checkout** code
2. **Install** dependencies (`npm ci`)
3. **Run** tests (`npm test`)
4. **Generate** coverage report (`npm run test:coverage`)
5. **Upload** coverage artifact (retained for 14 days)

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## 📄 License

ISC
