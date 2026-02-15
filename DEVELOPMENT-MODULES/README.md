# Sign-In Module - MERN Stack

A full-stack authentication system built with MongoDB, Express.js, React, and Node.js (MERN). This module provides secure user authentication with JWT tokens and OAuth integration (Google & GitHub).

## 🏗️ Project Structure

```
sign-in-module/
├── client/                 # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── OAuthSuccess.jsx
│   │   ├── services/      # API service layer
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                # Express Backend
│   ├── config/           # Configuration files
│   │   ├── database.js
│   │   └── passport.js
│   ├── controllers/      # Route controllers
│   │   └── auth.controller.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.middleware.js
│   ├── models/          # MongoDB models
│   │   └── User.js
│   ├── routes/          # API routes
│   │   └── auth.routes.js
│   ├── .env.example
│   ├── server.js
│   ├── seedDatabase.js
│   └── package.json
│
└── README.md
```

## ✨ Features

- ✅ User registration with email and password
- ✅ User login with JWT authentication
- ✅ OAuth authentication (Google & GitHub)
- ✅ Password hashing with bcrypt
- ✅ Token-based authentication
- ✅ Protected routes
- ✅ Form validation
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design
- ✅ MongoDB database integration

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

#### 1. Clone the repository

```bash
cd APP
```

#### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/fraud-detection-auth
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Seed the database with demo users:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

#### 3. Setup Frontend

Open a new terminal:

```bash
cd client
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

The `.env` file should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

The client will run on `http://localhost:3000`

## 📝 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/signin` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/google` | Google OAuth | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| GET | `/api/auth/github` | GitHub OAuth | No |
| GET | `/api/auth/github/callback` | GitHub OAuth callback | No |
| GET | `/api/health` | Health check | No |

### Request/Response Examples

#### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Sign In
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "rememberMe": false
}
```

## 🔐 OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## 🧪 Testing

### Demo Users

After running `npm run seed`, you can use these test credentials:

**Admin User:**
- Email: `admin@fraud-detection.com`
- Password: `admin123`

**Regular User:**
- Email: `user@fraud-detection.com`
- Password: `password123`

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Passport.js** - OAuth
- **bcryptjs** - Password hashing

## 📦 Scripts

### Client Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Server Scripts
```bash
npm run dev      # Start with nodemon
npm start        # Start production server
npm run seed     # Seed database with demo users
```

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- HTTP-only cookies support
- CORS configuration
- Input validation
- Environment variable protection

## 📱 Application Flow

1. **Sign Up**: User creates account → Password hashed → Stored in MongoDB → JWT token issued
2. **Sign In**: User logs in → Credentials verified → JWT token issued → Token stored in localStorage
3. **OAuth**: User clicks OAuth button → Redirected to provider → Callback with user data → JWT token issued
4. **Protected Routes**: Request with JWT → Token verified → Access granted/denied

## 🚧 Production Deployment

### Environment Variables for Production

Update these in your production environment:
- Change `JWT_SECRET` to a strong random string
- Change `SESSION_SECRET` to a strong random string
- Update `MONGODB_URI` to your MongoDB Atlas connection string
- Update `CLIENT_URL` to your frontend domain
- Update `CALLBACK_URL` to your backend domain
- Configure OAuth redirect URIs for production domains

### Build Commands

```bash
# Build frontend
cd client
npm run build

# The build output will be in client/dist
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is part of the Automated Fraud Detection System.

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify network connectivity

### OAuth Not Working
- Verify OAuth credentials in `.env`
- Check redirect URIs match exactly
- Ensure callback URLs are whitelisted in OAuth provider settings

### Port Already in Use
- Change PORT in server `.env`
- Update VITE_API_URL in client `.env`
- Update proxy in client `vite.config.js`

## 📞 Support

For issues and questions, please open an issue in the repository.
