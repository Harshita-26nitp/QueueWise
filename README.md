# QueueWise

QueueWise is a full-stack virtual queue management application. Business owners manage customer queues from a dashboard, while customers can discover businesses, receive digital queue tickets, and track their position without standing in a physical line.

## Features

### Customer

- Register, log in, and log out using JWT authentication.
- Browse and search businesses by name or category.
- See whether a business is open, the currently served ticket, waiting count, and estimated wait time.
- Join a queue and receive a unique ticket number such as `A001`.
- Track queue position, people ahead, and estimated wait time.
- Cancel a waiting ticket.

### Business owner

- Register as an owner and create/manage businesses.
- Open, close, pause, or resume a business queue.
- View the active queue and the customer currently being served.
- Serve the next customer, complete a ticket, cancel it, or mark it as a no-show.

### Engineering highlights

- Role-based access control for `CUSTOMER` and `OWNER` users.
- Password hashing with bcrypt and JWT-protected APIs.
- Modular backend architecture: routes, controllers, services, and Mongoose models.
- Atomic queue-number generation using MongoDB `$inc` to prevent duplicate ticket numbers.
- Database-backed queue-operation lock to prevent simultaneous **Serve Next** requests from advancing two customers.
- Socket.IO business rooms for real-time queue events.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios, React Router, Socket.IO Client |
| Backend | Node.js, Express.js, Mongoose, Socket.IO |
| Database | MongoDB / MongoDB Atlas |
| Authentication | JWT, bcryptjs |

## Architecture

```text
React + Tailwind CSS
        |
        | REST API / Socket.IO
        v
Node.js + Express
        |
        v
MongoDB + Mongoose
```

The backend follows this flow:

```text
Route -> Controller -> Service -> Model -> MongoDB
```

- **Routes** define endpoint URLs and apply authentication/role middleware.
- **Controllers** receive HTTP requests and return HTTP responses.
- **Services** contain business logic, such as joining a queue or serving the next customer.
- **Models** define MongoDB document schemas.

## Project structure

```text
queuewise/
├── backend/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       │   ├── auth/
│       │   ├── business/
│       │   └── queue/
│       ├── sockets/
│       ├── utils/
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── api.js
        ├── auth.jsx
        ├── App.jsx
        └── main.jsx
```

## Getting started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm
- A local MongoDB server or a MongoDB Atlas cluster

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/queuewise.git
cd queuewise
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://DATABASE_USERNAME:DATABASE_PASSWORD@cluster-name.mongodb.net/queuewise?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, add your current IP address in **Network Access** and create a database user in **Database Access**.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Configure the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the client:

```bash
npm run dev
```

Open `http://localhost:5173`.

## API overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a customer or owner |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auth/me` | Authenticated | Get current user |
| GET | `/api/businesses` | Public | List/search businesses |
| POST | `/api/businesses` | Owner | Create a business |
| GET | `/api/businesses/mine` | Owner | List owner businesses |
| GET | `/api/businesses/:businessId` | Public | Get business details |
| PATCH | `/api/businesses/:businessId` | Owner | Update business settings |
| GET | `/api/businesses/:businessId/queue` | Public | Get live queue snapshot |
| POST | `/api/businesses/:businessId/queue/join` | Customer | Join a queue |
| GET | `/api/businesses/:businessId/queue/my-ticket` | Customer | Get active ticket |
| PATCH | `/api/businesses/:businessId/queue/serve-next` | Owner | Serve the next customer |

## Postman quick test

1. Register an owner:

```json
{
  "name": "Aarav Mehta",
  "email": "aarav.owner@example.com",
  "password": "OwnerPass123",
  "role": "OWNER"
}
```

2. Register a customer:

```json
{
  "name": "Diya Sharma",
  "email": "diya.customer@example.com",
  "password": "CustomerPass123",
  "role": "CUSTOMER"
}
```

3. Copy each returned JWT and use the relevant header:

```text
Authorization: Bearer <token>
```

4. As the owner, create a business:

```json
{
  "name": "ABC Cafe",
  "category": "Cafe",
  "address": "12 Park Street, Kolkata",
  "averageServiceTime": 5,
  "queuePrefix": "A"
}
```

5. Copy the business `_id`; use it when the customer joins the queue.

## Queue status lifecycle

```text
WAITING -> SERVING -> COMPLETED
    |          |
    v          v
CANCELLED    NO_SHOW
```

## Future improvements

- QR-code queue joining
- Push, email, or SMS notifications when a customer is close to being served
- Multiple service counters per business
- Queue history and owner analytics
- Appointment booking and time slots
- Redis adapter for Socket.IO scaling across multiple backend instances