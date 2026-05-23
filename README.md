# DevPulse – Issue Tracker Backend

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## 🚀 Live Deployment
Backend API: https://dev-pulse-neon-rho.vercel.app/

## 🛠️ Technology Stack
- Node.js (LTS 24.x or higher)
- TypeScript (latest stable)
- Express.js (modular router architecture)
- PostgreSQL (NeonDB / Railway Postgres)
- bcrypt (password hashing, salt rounds 8–12)
- jsonwebtoken (JWT auth with access + refresh tokens)

## 👥 User Roles
- **Contributor**
  - Register & login
  - Create new issues (bug/feature_request)
  - View all issues
- **Maintainer**
  - All contributor permissions
  - Update any issue
  - Delete any issue
  - Change workflow status independently
  - Access system metrics

## 🔐 Authentication
- JWT-based authentication
- Access token (1 day expiry)
- Refresh token (15 days expiry, stored in httpOnly cookie)
- Role-based authorization middleware
- Global error handler middleware for consistent responses

## 🗄️ Database Schema

### users
| Field       | Requirement |
|-------------|-------------|
| id          | Auto-increment PK |
| name        | Required |
| email       | Unique, required |
| password    | Encrypted |
| role        | contributor/maintainer |
| created_at  | Timestamp |
| updated_at  | Timestamp |

### issues
| Field       | Requirement |
|-------------|-------------|
| id          | Auto-increment PK |
| title       | Required, max 150 chars |
| description | Required, min 20 chars |
| type        | bug / feature_request |
| status      | open / in_progress / resolved (default open) |
| reporter_id | References users.id (no unique constraint) |
| created_at  | Timestamp |
| updated_at  | Timestamp |

## 🌐 API Endpoints

### Auth
- `POST /api/auth/signup` → Register user
- `POST /api/auth/login` → Login & receive JWT

### Issues
- `POST /api/issues` → Create issue (auth required)
- `GET /api/issues` → Get all issues (public, supports sort/filter)
- `GET /api/issues/:id` → Get single issue (public)
- `PATCH /api/issues/:id` → Update issue (Maintainer OR Contributor if own & open)
- `DELETE /api/issues/:id` → Delete issue (Maintainer only)

## 📦 Setup

```bash
# Clone repo
git clone https://github.com/Jim2811/dev-pulse-backend.git
cd devpulse

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Build & run
npm run build
npm start
