<!DOCTYPE html>
<html lang="en">

<body>

  <h1>🎬 Movie Reservation System (Backend)</h1>

  <p>
    A <strong>production-ready backend</strong> for a movie ticket booking system
    built with <strong>Node.js, Express, MongoDB, and JWT authentication</strong>.
    Designed to handle secure authentication, role-based access, and concurrent seat bookings.
  </p>

  <hr />

  <h2>🚀 Features</h2>

  <h3>👤 User</h3>
  <ul>
    <li>JWT-based registration and login</li>
    <li>Browse movies and shows</li>
    <li>View real-time seat availability</li>
    <li>Temporarily lock seats before booking</li>
    <li>Confirm or cancel bookings</li>
    <li>View booking history</li>
  </ul>

  <h3>🛠️ Admin</h3>
  <ul>
    <li>Create movies and shows</li>
    <li>View analytics:
      <ul>
        <li>Total revenue</li>
        <li>Total bookings</li>
        <li>Seat occupancy per show</li>
        <li>Most popular shows</li>
      </ul>
    </li>
  </ul>

  <hr />

  <h2>🧠 Core Design</h2>

  <h3>Seat Lifecycle</h3>
  <pre>
FREE → LOCKED → BOOKED
  </pre>

  <ul>
    <li><strong>FREE</strong>: Available for booking</li>
    <li><strong>LOCKED</strong>: Temporarily held by a user</li>
    <li><strong>BOOKED</strong>: Permanently reserved</li>
  </ul>

  <p>
    Locked seats automatically expire if not confirmed within a defined time window.
  </p>

  <h3>Authentication & Authorization</h3>
  <ul>
    <li>Stateless authentication using JWT</li>
    <li>Role-based access control (<code>USER</code>, <code>ADMIN</code>)</li>
    <li>Protected routes via middleware</li>
  </ul>

  <hr />

  <h2>🏗️ Tech Stack</h2>
  <ul>
    <li>Node.js</li>
    <li>Express.js</li>
    <li>MongoDB</li>
    <li>Mongoose</li>
    <li>JSON Web Tokens (JWT)</li>
  </ul>

  <hr />

  <h2>📁 Project Structure</h2>
  <pre>
server/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── config/
├── app.js
└── server.js
  </pre>

  <hr />

  <h2>🔗 API Endpoints</h2>

  <h3>🔐 Auth</h3>
  <ul>
    <li><code>POST /api/auth/register</code></li>
    <li><code>POST /api/auth/login</code></li>
  </ul>

  <h3>🎥 Movies</h3>
  <ul>
    <li><code>POST /api/movies</code> (Admin)</li>
    <li><code>GET /api/movies</code></li>
  </ul>

  <h3>🎭 Shows</h3>
  <ul>
    <li><code>POST /api/shows</code> (Admin)</li>
    <li><code>GET /api/shows/:movieId</code></li>
  </ul>

  <h3>💺 Seats</h3>
  <ul>
    <li><code>GET /api/seats/:showId</code></li>
    <li><code>POST /api/seats/lock</code></li>
  </ul>

  <h3>🎟️ Bookings</h3>
  <ul>
    <li><code>POST /api/bookings/confirm</code></li>
    <li><code>GET /api/bookings/my</code></li>
    <li><code>PATCH /api/bookings/cancel/:bookingId</code></li>
  </ul>

  <h3>📊 Admin Analytics</h3>
  <ul>
    <li><code>GET /api/admin/stats</code> (Admin)</li>
  </ul>

  <hr />

  <h2>⚙️ Setup</h2>

  <h3>1️⃣ Clone</h3>
  <pre>
git clone &lt;repository-url&gt;
cd movie-reservation-system
  </pre>

  <h3>2️⃣ Install Dependencies</h3>
  <pre>
npm install
  </pre>

  <h3>3️⃣ Environment Variables</h3>
  <pre>
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/movie_reservation
JWT_SECRET=your_jwt_secret
  </pre>

  <h3>4️⃣ Run Server</h3>
  <pre>
npm run dev
  </pre>

  <p>Server runs at <code>http://localhost:5000</code></p>

  <hr />

  <h2>🧪 Testing</h2>
  <ul>
    <li>Use Postman or Thunder Client</li>
    <li>Send JWT in headers:
      <pre>Authorization: Bearer &lt;TOKEN&gt;</pre>
    </li>
    <li>Use an ADMIN token for admin routes</li>
  </ul>

</body>
</html>
