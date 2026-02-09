# Backend API Documentation

Complete backend implementation for the sign-in module with Node.js, Express, JWT authentication, and bcrypt password hashing.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sign-in-module/backend
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on `http://localhost:5000`

For development with auto-reload:

```bash
npm run dev
```

## 📁 File Structure

```
backend/
├── server.js          # Main Express server
├── package.json       # Dependencies and scripts
├── users.json         # Demo user accounts
├── .env              # Environment configuration
└── BACKEND_README.md # This file
```

## 🔐 Test Accounts

Use these credentials to test the sign-in:

| Email                       | Password      | Role  |
| --------------------------- | ------------- | ----- |
| `admin@fraud-detection.com` | `admin123`    | admin |
| `user@fraud-detection.com`  | `password123` | user  |

## 📡 API Endpoints

### Sign In

**Endpoint**: `POST /api/auth/signin`

**Request Body**:

```json
{
  "email": "admin@fraud-detection.com",
  "password": "admin123",
  "rememberMe": false
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Sign in successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "admin@fraud-detection.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Error Response** (401):

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Health Check

**Endpoint**: `GET /api/health`

**Response** (200):

```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T16:48:37.123Z"
}
```

### Get Current User (Protected)

**Endpoint**: `GET /api/auth/me`

**Headers**:

```
Authorization: Bearer <your-jwt-token>
```

**Success Response** (200):

```json
{
  "success": true,
  "user": {
    "userId": "1",
    "email": "admin@fraud-detection.com",
    "name": "Admin User"
  }
}
```

## 🔧 Configuration

### Environment Variables (.env)

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` in production!

## 🧪 Testing the API

### Using cURL

```bash
# Sign in
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fraud-detection.com","password":"admin123","rememberMe":false}'

# Health check
curl http://localhost:5000/api/health

# Get current user (replace TOKEN with actual token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using the Frontend

1. Make sure backend is running: `npm start`
2. Open `sign-in-module/index.html` in your browser
3. Sign in with test credentials
4. Check browser console for token
5. Token is stored in `localStorage`

## 🔒 Security Features

✅ **Password Hashing**: All passwords stored as bcrypt hashes (10 salt rounds)  
✅ **JWT Tokens**: Secure token-based authentication  
✅ **Token Expiration**: 24 hours (or 7 days if "Remember me" checked)  
✅ **Input Validation**: Email format and required field validation  
✅ **CORS Enabled**: Allows frontend to communicate with backend  
✅ **Secure Error Messages**: Don't expose sensitive information

## 📝 Adding New Users

To add a new user, you need to hash the password first:

### Node.js Script to Hash Password

```javascript
const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log("Hashed password:", hash);
}

hashPassword("your-password-here");
```

Then add the user to `users.json`:

```json
{
  "id": "3",
  "email": "newuser@example.com",
  "password": "HASHED_PASSWORD_HERE",
  "name": "New User",
  "role": "user"
}
```

## 🛠️ Troubleshooting

### Backend won't start

- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 5000 is available

### Frontend can't connect to backend

- Make sure backend is running: `npm start`
- Check console for error messages
- Verify URL is `http://localhost:5000`
- Check CORS settings in `server.js`

### Invalid credentials error

- Double-check email and password
- Use one of the test accounts listed above
- Passwords are case-sensitive

## 📦 Dependencies

- **express** (^4.18.2): Fast web framework
- **bcryptjs** (^2.4.3): Password hashing
- **jsonwebtoken** (^9.0.2): JWT token generation/verification
- **cors** (^2.8.5): Cross-origin resource sharing
- **dotenv** (^16.3.1): Environment variable management

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Change `JWT_SECRET` to a strong random string
2. ✅ Set `NODE_ENV=production` in `.env`
3. ✅ Use a real database instead of `users.json`
4. ✅ Add rate limiting to prevent brute force attacks
5. ✅ Use HTTPS for all requests
6. ✅ Add logging and monitoring
7. ✅ Implement password reset functionality
8. ✅ Add email verification

## 📚 Next Steps

1. **Database Integration**: Replace `users.json` with MongoDB or PostgreSQL
2. **Sign Up Endpoint**: Create user registration API
3. **Password Reset**: Implement forgot password functionality
4. **Refresh Tokens**: Add token refresh mechanism
5. **Role-Based Access**: Implement authorization middleware
6. **Email Verification**: Add email confirmation on signup

## 💡 Example: Using the Token

After sign-in, the frontend stores the token in `localStorage`. Use it to make authenticated requests:

```javascript
const token = localStorage.getItem("authToken");

fetch("http://localhost:5000/api/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => console.log("User info:", data));
```

## 📞 Support

For issues or questions, check:

- Server console logs
- Browser console errors
- API response messages

---

**Built for**: Automated Fraud Detection System  
**Version**: 1.0.0  
**Last Updated**: February 2026
