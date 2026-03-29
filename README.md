# 🎬 CineBook — Movie Reservation System

A full-stack movie ticket booking platform with real-time seat selection, Stripe payments, QR-coded email confirmations, and a comprehensive admin dashboard.

![CineBook](https://img.shields.io/badge/CineBook-Movie%20Booking-e63030?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socket.io&logoColor=white)

---

## ✨ Features

### User Features
- 🎥 **Movie browsing** — Filter by genre, language, and city with live search
- 🗓️ **Show scheduling** — Browse shows by date tab, theater, and screen
- 💺 **Real-time seat map** — Live seat updates via WebSocket (zero polling)
- 🔒 **Seat locking** — 5-minute optimistic hold with countdown timer; restored correctly on page refresh
- 💳 **Stripe payments** — Full two-step payment intent flow with INR support
- 💰 **Automated refunds** — Stripe refund triggered automatically on cancellation
- 🎫 **QR ticket email** — Booking confirmation with inline QR code sent fire-and-forget
- 👤 **Auth** — JWT-based login/register; expired tokens auto-redirect to `/login`
- 📋 **My Bookings** — Tabbed upcoming / past & cancelled view with cancel action

### Admin Features
- 📊 **Analytics dashboard** — Total revenue (confirmed only), booking count, cancellation rate, per-show occupancy %, and top-5 popular shows
- 🎬 **Movie management** — Add (manual or TMDB sync), view with poster, delete with cascade guard
- 🏢 **Theater management** — Add with amenity tags, delete with cascade guard
- 🎭 **Show management** — Create per movie+theater+screen, view inline per movie, delete
- 💺 **Seat generation** — Configurable rows (1–10) × seats-per-row (1–20), auto-labelled A1…F12
- 🔄 **TMDB one-click sync** — Imports up to 10 now-playing movies, creates default theaters if none exist, generates shows across 4 daily slots × 7 days × all theaters, and inserts seats automatically

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React SPA (Vite)                         │
│   Movies → Shows → Seats → CheckoutForm → BookingTicket         │
│   AuthContext  |  axios interceptors  |  Socket.io client        │
└────────────┬──────────────────────────────────┬─────────────────┘
             │  HTTP / REST (axios)              │  WebSocket (ws://)
             ▼                                   ▼
┌────────────────────────────────────────────────────────────────┐
│                    Node.js HTTP Server (port 5000)              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express App (app.js)                   │  │
│  │                                                           │  │
│  │  Helmet → CORS → Stripe Raw Body (webhook only)          │  │
│  │  → express.json() → Morgan → generalLimiter              │  │
│  │                                                           │  │
│  │  /api/auth      authLimiter    → auth.controller         │  │
│  │  /api/movies    adminLimiter   → movie.controller        │  │
│  │  /api/theaters  adminLimiter   → theater.controller      │  │
│  │  /api/shows     adminLimiter   → show.controller         │  │
│  │  /api/seats     adminLimiter   → seat.controller         │  │
│  │  /api/seats     seatLockLimiter→ lock.controller         │  │
│  │  /api/bookings  bookingLimiter → booking.controller      │  │
│  │  /api/payments  bookingLimiter → payment.controller      │  │
│  │  /api/admin     adminLimiter   → admin.controller        │  │
│  │  /api/admin     adminLimiter   → tmdb.controller         │  │
│  │  /api/health                  → inline handler           │  │
│  │                                                           │  │
│  │  Global error handler (ApiError / Mongoose / JWT / 500)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Socket.io Server (same port)                 │  │
│  │  join:show → room show:<id>                              │  │
│  │  leave:show → leave room                                 │  │
│  │  emit seats:updated → to room show:<id>                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  setInterval(releaseExpiredLocks, LOCK_TIME_MS)  ← background  │
└──────────────┬─────────────────────────────────────────────────┘
               │  Mongoose ODM
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MongoDB (Atlas / local replica set)             │
│  Collections: users · movies · theaters · shows · seats ·       │
│               bookings                                           │
│  Transactions: lock, unlock, confirm booking, cancel, cascade   │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐   ┌────────────────────────────┐
│  Stripe API                 │   │  TMDB API                  │
│  paymentIntents.create      │   │  /movie/now_playing        │
│  paymentIntents.retrieve    │   │  /movie/:id (details)      │
│  refunds.create             │   └────────────────────────────┘
│  webhooks.constructEvent    │
└─────────────────────────────┘
               │  fire-and-forget (after res.json)
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Gmail SMTP (Nodemailer)                                      │
│  QRCode.toBuffer(bookingId) → inline CID attachment          │
│  HTML email with booking details + QR                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server (ES Modules) |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.io** | Real-time seat map updates (WebSocket) |
| **Stripe** | Payment intents, refunds, webhook verification |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password hashing (cost 10) |
| **Nodemailer + QRCode** | Fire-and-forget booking confirmation email |
| **Winston** | Structured logging with file rotation |
| **express-validator** | Input validation & ObjectId checks |
| **express-rate-limit** | Per-endpoint rate limiting (prod only) |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging piped to Winston |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with request/response interceptors |
| **Stripe.js + @stripe/react-stripe-js** | Hosted payment element (PCI scope stays with Stripe) |
| **Socket.io Client** | Real-time seat map subscription |
| **QRCode.js** | Client-side QR canvas rendering on ticket modal |
| **CSS Modules** | Scoped component styles |
| **Vite** | Build tool & dev server |

---

## 📁 Project Structure

```
cinebook/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection + graceful shutdown
│   │   ├── env.js                 # dotenv loader
│   │   ├── lock.config.js         # LOCK_TIME_MS (shared constant — must match frontend)
│   │   └── stripe.config.js       # Stripe SDK initialisation
│   ├── controllers/
│   │   ├── admin.controller.js    # Stats aggregation (revenue, occupancy, popular shows)
│   │   ├── auth.controller.js     # register / login
│   │   ├── booking.controller.js  # getMyBookings / cancelBooking (+ Stripe refund)
│   │   ├── lock.controller.js     # lockSeats / unlockSeats (atomic + socket emit)
│   │   ├── movie.controller.js    # CRUD + ReDoS-safe regex search
│   │   ├── payment.controller.js  # createPaymentIntent / confirmBooking / webhook
│   │   ├── seat.controller.js     # generateSeatsForShow / getSeatsForShow
│   │   ├── show.controller.js     # CRUD + location/movie/theater filters
│   │   ├── theater.controller.js  # CRUD + location helpers
│   │   └── tmdb.controller.js     # TMDB sync → movies + shows + seats
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verify + user fetch
│   │   ├── role.middleware.js     # authorizeRoles(...roles)
│   │   ├── rateLimit.middleware.js# 5 limiters (prod-only, no-op in dev)
│   │   └── validation.middleware.js # express-validator rules for all endpoints
│   ├── models/
│   │   ├── booking.model.js
│   │   ├── movie.model.js
│   │   ├── seat.model.js          # 4 indexes incl. compound unique (show+seatNumber)
│   │   ├── show.model.js
│   │   ├── theater.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── lock.routes.js         # mounted on /api/seats alongside seat.routes.js
│   │   ├── movie.routes.js
│   │   ├── payment.routes.js      # webhook registered in app.js before express.json()
│   │   ├── seat.routes.js
│   │   ├── show.routes.js
│   │   ├── theater.routes.js
│   │   └── user.routes.js
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class with statusCode
│   │   ├── asyncHandler.js        # HOF: wraps controllers, calls next(err) on throw
│   │   ├── emailService.js        # Nodemailer + QR buffer + CID inline attachment
│   │   ├── jwt.js                 # generateToken / verifyToken / decodeToken
│   │   ├── logger.js              # Winston (console + file rotation)
│   │   ├── releaseExpiredLocks.js # Cron: FREE expired LOCKED seats + emit socket
│   │   ├── seatGenerator.js       # A1…F12 alphanumeric seat label generator
│   │   ├── socket.js              # initSocket / emitSeatUpdate / getIO
│   │   └── transaction.utils.js   # withTransaction(callback) helper
│   ├── app.js                     # Express app, middleware chain, route mounting
│   └── server.js                  # HTTP server + Socket.io init
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AuthForm.jsx           # Shared login/register form + password strength bar
    │   │   ├── BookingTicket.jsx      # Modal ticket with QR canvas + print button
    │   │   ├── CheckoutForm.jsx       # Stripe PaymentElement wrapper
    │   │   ├── MovieCard.jsx          # Poster card + skeleton loader
    │   │   ├── Seat.jsx               # Single seat with 4 visual states
    │   │   ├── SeatGrid.jsx           # Rows with aisle gap + row labels
    │   │   └── ShowCard.jsx           # Compact show time card
    │   ├── config/
    │   │   ├── lock.config.js         # LOCK_TIME_MS (must match backend)
    │   │   └── stripe.config.js       # loadStripe(publishable key)
    │   ├── context/
    │   │   └── AuthContext.jsx        # user state, login/register/logout, token expiry check
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx     # Stats + CRUD forms + TMDB sync button
    │   │   ├── Login.jsx
    │   │   ├── Movies.jsx             # Movie grid with search + 3 filter dropdowns
    │   │   ├── MyBookings.jsx         # Upcoming / Past tabs + cancel action
    │   │   ├── Register.jsx
    │   │   ├── Seats.jsx              # Seat picker + socket + countdown + Stripe flow
    │   │   └── Shows.jsx              # Date-tab strip + theater groups + location filter
    │   ├── services/
    │   │   └── api.js                 # Axios instance + Bearer token interceptor + 401 redirect
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css                  # CSS custom properties (design tokens) + global reset
    └── .env
```

---

## 💳 Payment & Booking Flow

```
User selects seats
       │
       ▼
POST /api/seats/lock          ← atomic MongoDB transaction
       │                         validates: FREE or own LOCK, not past show, max 10
       │ success                 emits seats:updated to show room via Socket.io
       ▼
POST /api/payments/create-payment-intent
       │                         validates: seats still LOCKED by this user, not expired
       │                         creates Stripe PaymentIntent (amount in paise)
       ▼
Stripe.js confirmPayment()    ← runs entirely inside Stripe's iframe (PCI scope)
       │
       ▼
POST /api/payments/confirm-booking
       │                         retrieves PaymentIntent server-side (unforgeable)
       │                         re-validates seats LOCKED + not expired
       │                         atomic transaction: seats → BOOKED, Booking → CONFIRMED
       │                         res.json() ← responds immediately
       │
       └──► sendBookingConfirmationEmail()  ← fire-and-forget (.catch logs error)
                                               QRCode.toBuffer(bookingId)
                                               Gmail SMTP + CID inline attachment
```

**Cancellation:** `PATCH /api/bookings/cancel/:id` → if `paymentStatus === PAID`, calls `stripe.refunds.create()` before marking seats FREE and booking CANCELLED.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |

### Movies
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/movies` | ❌ | List movies — paginated, filterable by `search`, `genre`, `language` |
| POST | `/api/movies` | ADMIN | Create a movie |
| DELETE | `/api/movies/:movieId` | ADMIN | Delete movie + cascade shows/seats/cancelled bookings |

### Theaters
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/theaters` | ❌ | All theaters |
| GET | `/api/theaters/locations` | ❌ | Unique city list |
| GET | `/api/theaters/location/:location` | ❌ | Theaters by city |
| POST | `/api/theaters` | ADMIN | Create theater |
| DELETE | `/api/theaters/:theaterId` | ADMIN | Delete theater + cascade |

### Shows
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shows/movie/:movieId` | ❌ | Shows for a movie (`?includePast=true`) |
| GET | `/api/shows/location/:location` | ❌ | Shows by city |
| GET | `/api/shows/theater/:theaterId` | ❌ | Shows by theater |
| POST | `/api/shows` | ADMIN | Create a show |
| DELETE | `/api/shows/:showId` | ADMIN | Delete show + cascade |

### Seats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/seats/:showId` | ❌ | Full seat map for a show |
| POST | `/api/seats/generate/:showId` | ADMIN | Generate seats (`rows`, `seatsPerRow`) |
| POST | `/api/seats/lock` | USER | Lock up to 10 seats (atomic transaction) |
| POST | `/api/seats/unlock` | USER | Release locked seats |

### Payments & Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-payment-intent` | USER | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm-booking` | USER | Confirm booking after payment succeeds |
| POST | `/api/payments/webhook` | Stripe | Stripe webhook (raw body, signature verified) |
| GET | `/api/bookings/my` | USER | User's bookings (paginated) |
| PATCH | `/api/bookings/cancel/:bookingId` | USER | Cancel booking + auto Stripe refund |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | ADMIN | Revenue, booking counts, cancellation rate, occupancy, top-5 popular shows |
| POST | `/api/admin/sync-movies` | ADMIN | Import now-playing from TMDB + auto-generate shows & seats |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Server status + DB connection state + uptime |
| GET | `/api/user/profile` | USER | Authenticated user profile |

---

## 🔐 Security

### Authentication & Authorisation
- JWT signed with HMAC-SHA256; `exp` claim enforced server-side
- `authMiddleware` decodes token → fetches user from DB (deleted users blocked)
- `authorizeRoles(...roles)` runs after auth; checks `req.user.role`
- Passwords hashed with bcrypt cost factor 10; plaintext never stored or logged

### Input Validation
- `express-validator` on every mutation endpoint; invalid requests rejected at middleware, never reach controller
- User-supplied regex strings sanitised via `escapeRegex()` before `new RegExp()` to prevent ReDoS

### Rate Limiting (production only — no-op in development)
| Limiter | Window | Max | Applied to |
|---|---|---|---|
| `generalLimiter` | 15 min | 100 req | All `/api/*` routes |
| `authLimiter` | 15 min | 5 req | `/api/auth/*` (skips successful) |
| `seatLockLimiter` | 1 min | 20 req | `/api/seats/lock` and `/unlock` |
| `bookingLimiter` | 5 min | 10 req | `/api/payments/*` and `/api/bookings/*` |
| `adminLimiter` | 1 min | 30 req | `/api/admin/*`, create/delete routes |

### Other
- **Helmet** — sets CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
- **CORS** — explicit `FRONTEND_URL` allowlist; no wildcard origins
- **Stripe webhook** — `stripe.webhooks.constructEvent()` with raw body; tampered requests rejected 400
- **MongoDB transactions** — seat lock/unlock/booking/cancel run inside `withTransaction()`; aborts automatically on any error

---

## 🗄️ Database Schema

### Collections & Key Fields

```
Users          name · email · password (bcrypt) · role (USER|ADMIN)

Movies         title · description · duration · language · genre[] · posterUrl

Theaters       name · location · address · amenities[]

Shows          movie (ref) · theater (ref) · screen · startTime · price
               index: { movie, theater, startTime }

Seats          show (ref) · seatNumber · status (FREE|LOCKED|BOOKED)
               lockedAt · lockedBy (ref User)
               indexes:
                 { show, seatNumber }  unique — prevents duplicate seats
                 { status, lockedAt }  — expired lock cleanup job
                 { lockedBy, status }  — unlock-on-navigate queries
                 { show }              — seat map fetch

Bookings       user (ref) · show (ref) · seats[] (ref) · totalAmount
               status (CONFIRMED|CANCELLED)
               paymentIntentId · paymentStatus (PENDING|PAID|FAILED|REFUNDED)
```

### Cascade Delete
Confirmed bookings block deletion of their parent Movie / Theater / Show with a user-facing error. Cascade only runs for cancelled bookings + orphaned seats, inside a `withTransaction()` to prevent partial deletes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local with replica set, or [Atlas](https://www.mongodb.com/atlas) free tier — replica set required for transactions)
- [Stripe](https://stripe.com) account (test mode is fine)
- [TMDB](https://www.themoviedb.org/settings/api) API Bearer token (free)
- Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for email (optional)

### 1. Clone & configure

```bash
git clone https://github.com/SahilSonar-04/movie-reservation-system.git
configure env in client and server folders
```

### 2. Install dependencies

```bash
# server
npm install

# client
npm install
```

### 3. Run in development

```bash
# server
npm run dev

# client
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

### 4. Create an admin user

There is no admin registration endpoint by design. Promote a user via MongoDB shell or Compass:

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "ADMIN" } }
)
```

### 5. Seed movie data

Log in as admin and click **"Fetch latest movies"** in the dashboard, or:

```bash
curl -X POST http://localhost:5000/api/admin/sync-movies \
  -H "Authorization: Bearer <admin_token>"
```

This imports up to 10 now-playing films from TMDB, creates 3 default Indian theaters if none exist, generates shows for every theater × 4 daily slots × 7 days ahead, and inserts 72 seats per show (6 rows × 12).

---

## 👤 Author

Built by **Sahil Sonar**
