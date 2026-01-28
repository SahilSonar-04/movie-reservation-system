# 🎬 CineBook - Movie Reservation System

A full-stack movie ticket booking platform with real-time seat selection, secure payments via Stripe, and comprehensive admin management capabilities.

![Tech Stack](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)

## 🌟 Key Features

### User Features
- **🔐 Secure Authentication** - JWT-based authentication with role-based access control
- **🎥 Movie Browsing** - Browse movies with filters (language, genre, location)
- **📍 Location-based Search** - Find theaters and shows by city
- **💺 Real-time Seat Selection** - Interactive seat map with live availability updates
- **🔒 Seat Locking Mechanism** - Temporary seat locks (5 minutes) during checkout
- **💳 Stripe Payment Integration** - Secure payment processing with INR support
- **📱 Booking Management** - View booking history and cancel reservations
- **💰 Automated Refunds** - Automatic refund processing for cancellations

### Admin Features
- **📊 Analytics Dashboard** - Revenue tracking, booking statistics, occupancy rates
- **🎬 Movie Management** - Add, view, and delete movies
- **🏢 Theater Management** - Manage theaters and locations
- **🎭 Show Management** - Create and schedule movie shows
- **💺 Seat Generation** - Automated seat layout generation for shows
- **📈 Popular Shows Tracking** - View most booked shows and performance metrics

## 🏗️ System Architecture

### Backend Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway Layer                      │
│  (Express.js + Helmet + CORS + Rate Limiting)            │
└───────────────────┬─────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐    ┌────▼─────┐   ┌────▼─────┐
│  Auth  │    │ Business │   │  Admin   │
│ Layer  │    │  Logic   │   │  Layer   │
└───┬────┘    └────┬─────┘   └────┬─────┘
    │              │              │
    └──────────────┼──────────────┘
                   │
        ┌──────────▼──────────┐
        │   Data Access Layer │
        │  (MongoDB + Models) │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   External Services │
        │  (Stripe Payments)  │
        └─────────────────────┘
```

### Tech Stack

**Frontend**
- React 19.2.0 with React Router v7
- Axios for API communication
- Stripe React library for payment UI
- Custom inline styling (production-ready)

**Backend**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Stripe payment gateway
- Winston logger
- Express Rate Limiter

**Security & Performance**
- Helmet.js for security headers
- CORS configuration
- Input validation (express-validator)
- MongoDB transactions for data consistency
- Indexed database queries
- Rate limiting per endpoint

## 🚀 Getting Started

### Prerequisites
```bash
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Stripe account for payment processing
- npm or yarn package manager
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cinebook.git
cd cinebook
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

4. **Environment Configuration**

Create `.env` in the server directory:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/cinebook

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Logging
LOG_LEVEL=info
```

Create `.env` in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

5. **Run the Application**

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
```

### Movie Endpoints
```
GET    /api/movies           - Get all movies (with filters)
POST   /api/movies           - Create movie (Admin only)
DELETE /api/movies/:id       - Delete movie (Admin only)
```

### Theater Endpoints
```
GET    /api/theaters                    - Get all theaters
GET    /api/theaters/locations          - Get unique locations
GET    /api/theaters/location/:location - Get theaters by city
POST   /api/theaters                    - Create theater (Admin)
DELETE /api/theaters/:id                - Delete theater (Admin)
```

### Show Endpoints
```
GET    /api/shows/movie/:movieId        - Get shows by movie
GET    /api/shows/location/:location    - Get shows by location
GET    /api/shows/theater/:theaterId    - Get shows by theater
POST   /api/shows                       - Create show (Admin)
DELETE /api/shows/:id                   - Delete show (Admin)
```

### Seat Endpoints
```
GET    /api/seats/:showId               - Get seats for show
POST   /api/seats/generate/:showId      - Generate seats (Admin)
POST   /api/seats/lock                  - Lock seats temporarily
POST   /api/seats/unlock                - Unlock seats
```

### Booking Endpoints
```
GET    /api/bookings/my                 - Get user's bookings
POST   /api/bookings/confirm            - Confirm booking
PATCH  /api/bookings/cancel/:id         - Cancel booking
```

### Payment Endpoints
```
POST   /api/payments/create-payment-intent  - Create Stripe payment
POST   /api/payments/confirm-booking        - Confirm after payment
POST   /api/payments/webhook                - Stripe webhook handler
```

### Admin Endpoints
```
GET    /api/admin/stats                 - Get admin dashboard stats
```

## 🔐 Security Features

1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control (USER/ADMIN)
   - Token expiration and refresh handling
   - Password hashing with bcrypt (10 rounds)

2. **Input Validation**
   - Express-validator for all endpoints
   - MongoDB ObjectId validation
   - Email format validation
   - Password strength requirements

3. **Rate Limiting**
   - General API: 100 requests/15 min
   - Auth endpoints: 5 attempts/15 min
   - Seat locking: 20 requests/min
   - Booking: 10 requests/5 min
   - Admin: 30 requests/min

4. **Data Protection**
   - Helmet.js security headers
   - CORS configuration
   - SQL injection prevention (MongoDB)
   - XSS protection

5. **Transaction Safety**
   - MongoDB ACID transactions
   - Atomic seat booking operations
   - Rollback on failures
   - Race condition prevention

## 💡 Key Technical Implementations

### 1. Seat Locking Mechanism
Prevents double-booking through temporary locks:
- 5-minute lock duration
- Automatic expiration cleanup
- User-specific lock validation
- Race condition handling with atomic operations

### 2. Payment Flow
Secure two-phase commit pattern:
1. Lock seats → Create payment intent → User pays
2. Verify payment → Confirm booking → Update seat status
3. Rollback on any failure

### 3. Real-time Seat Updates
- 2-second polling for seat status
- Optimistic UI updates
- Conflict resolution on booking

### 4. Database Optimization
- Compound indexes on frequently queried fields
- Aggregation pipelines for analytics
- Connection pooling (max 10 connections)
- Lean queries for read operations

## 📊 Database Schema

### Collections Overview
```
Users
├─ Authentication & profiles
└─ Role-based permissions

Movies
├─ Title, description, metadata
└─ Genre, language, duration

Theaters
├─ Name, location, address
└─ Amenities

Shows
├─ Movie + Theater + Time
└─ Screen, pricing

Seats
├─ Show reference
├─ Status (FREE/LOCKED/BOOKED)
└─ Lock metadata

Bookings
├─ User + Show + Seats
├─ Payment information
└─ Status (CONFIRMED/CANCELLED)
```

## 🧪 Testing the Application

### Creating an Admin User
Run this in MongoDB shell:
```javascript
db.users.updateOne(
  { email: "admin@cinebook.com" },
  { $set: { role: "ADMIN" } }
);
```

### Sample Data Flow
1. Admin creates theater and movies
2. Admin creates shows and generates seats
3. User browses movies and selects show
4. User locks seats and proceeds to payment
5. Payment processed → Booking confirmed
6. User can view/cancel bookings

This project is open source and available under the [MIT License](LICENSE).
