# ⛳ Golf Charity Subscription Platform

> A production-ready subscription platform where golfers track scores, enter monthly draws, and contribute to charities.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT-based register/login with role-based access (User / Admin) |
| 💳 Subscriptions | Monthly & Yearly plans (simulated, no real payments) |
| ⛳ Score Tracking | Last-5 Stableford rolling scores per user |
| 🎲 Monthly Draws | Admin triggers draws; 5 random numbers matched to user scores |
| 🏆 Prize Tiers | Bronze (3 match), Silver (4 match), Gold (5 match) |
| 💚 Charity | Users select charity + contribution % (min 10%) |
| 📊 Admin Panel | Full user management, draw system, winners list, analytics |

---

## 🗂 Project Structure

```
golf-charity/
├── client/                   # React frontend (Tailwind CSS)
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── shared/       # AppLayout, LoadingSpinner
│       ├── context/          # AuthContext (JWT state)
│       ├── pages/            # All route-level pages
│       │   └── admin/        # Admin-only pages
│       ├── utils/            # Axios API instance
│       └── styles/           # Global CSS + Tailwind
│
└── server/                   # Node.js + Express backend
    ├── config/               # DB connection, seed script
    ├── controllers/          # Business logic
    ├── middleware/           # JWT auth middleware
    ├── models/               # Mongoose schemas
    └── routes/               # Express routers
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) free tier)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd golf-charity

# Install both server and client dependencies
npm run install:all
```

### 2. Configure Environment Variables

**Server** — copy and fill in:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/golf_charity
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client** — copy and fill in:
```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

> **Note:** In development, `"proxy": "http://localhost:5000"` in `client/package.json` means you can omit `REACT_APP_API_URL` and requests to `/api/...` will automatically proxy to the server.

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 5 default charities
- Admin user: `admin@golfcharity.com` / `Admin@1234`

### 4. Run Development Servers

Open two terminals:

```bash
# Terminal 1 — Backend (http://localhost:5000)
npm run dev:server

# Terminal 2 — Frontend (http://localhost:3000)
npm run dev:client
```

Visit `http://localhost:3000` 🎉

---

## 🗄 Database Schema

### Users
```
id, name, email, password (hashed), role (user|admin)
subscription_status (active|inactive|cancelled), plan (monthly|yearly)
subscription_start, subscription_end
charity_id (ref), charity_percentage
```

### Scores
```
id, user_id (ref), score (1–45), date
```
> Rolling logic: max 5 scores per user. Adding a 6th removes the oldest.

### Draws
```
id, draw_numbers ([5 ints]), date, month (YYYY-MM), status (draft|published), triggered_by
```

### Winners
```
id, user_id, draw_id, match_count (3|4|5), matched_numbers, prize_tier (bronze|silver|gold), status
```

### Charities
```
id, name, description, image, active
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/dashboard` | ✅ | Full dashboard data |
| POST | `/api/users/subscribe` | ✅ | Subscribe (monthly/yearly) |
| POST | `/api/users/cancel-subscription` | ✅ | Cancel subscription |

### Scores
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/scores` | ✅ | Get user's scores |
| POST | `/api/scores` | ✅ | Add score (rolling 5) |
| DELETE | `/api/scores/:id` | ✅ | Delete a score |

### Draws
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/draws` | ✅ | Published draws |
| GET | `/api/draws/my-results` | ✅ | User's wins |
| GET | `/api/draws/all` | 🔒 Admin | All draws |
| POST | `/api/draws/run` | 🔒 Admin | Generate draw |
| PUT | `/api/draws/:id/publish` | 🔒 Admin | Publish draw |

### Charities
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/charities` | ✅ | List all charities |
| POST | `/api/charities/select` | ✅ | Select charity |
| POST | `/api/charities` | 🔒 Admin | Create charity |
| PUT | `/api/charities/:id` | 🔒 Admin | Update charity |
| DELETE | `/api/charities/:id` | 🔒 Admin | Deactivate charity |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | 🔒 Admin | Analytics stats |
| GET | `/api/admin/users` | 🔒 Admin | All users |
| GET | `/api/admin/users/:id/scores` | 🔒 Admin | User's scores |
| PUT | `/api/admin/users/:id/subscription` | 🔒 Admin | Edit subscription |
| PUT | `/api/admin/scores/:id` | 🔒 Admin | Edit a score |
| GET | `/api/admin/winners` | 🔒 Admin | All winners |

---

## 🚀 Deployment

### Backend → Render

1. Create account at [render.com](https://render.com)
2. New → **Web Service** → connect your GitHub repo
3. Set **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...   ← from MongoDB Atlas
   JWT_SECRET=your_production_secret_min_32_chars
   CLIENT_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```
7. Deploy! Note your Render URL: `https://your-app.onrender.com`

### Frontend → Vercel

1. Create account at [vercel.com](https://vercel.com)
2. New Project → Import GitHub repo
3. Set **Root Directory**: `client`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-app.onrender.com/api
   ```
5. Deploy! Your app is live at `https://your-app.vercel.app`

### Post-deploy Seed

After deploying, seed your production database by running locally with your Atlas URI:
```bash
MONGODB_URI=mongodb+srv://... npm run seed
```

---

## 🧪 Test Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@golfcharity.com | Admin@1234 |
| User | Register at `/register` | Any |

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (salt rounds: 12)
- JWT tokens expire in **30 days**
- Admin routes protected by `adminOnly` middleware
- CORS restricted to `CLIENT_URL` env variable
- Change `JWT_SECRET` to a strong random string in production

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Charts | Recharts |
| Notifications | react-hot-toast |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📋 Key Logic

### Score Rolling (server/controllers/scoreController.js)
```
If user has 5 scores → delete oldest → add new
Always keep last 5 scores, sorted by date descending
```

### Draw System (server/controllers/drawController.js)
```
1. Generate 5 unique random numbers (1–45)
2. For each active subscriber, compare their scores to draw numbers
3. Count intersections: 3 = Bronze, 4 = Silver, 5 = Gold
4. Store winners as 'pending' until admin publishes
```

---

Built with ❤️ for golfers who care.
