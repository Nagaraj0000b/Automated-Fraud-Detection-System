# Sign-In Module

A modern, secure, and API-ready sign-in component for the Automated Fraud Detection System built with React and Tailwind CSS.

## Features

✨ **Modern Design**

- Glassmorphism UI with backdrop blur effects
- Animated gradient background with floating blobs
- Smooth transitions and micro-animations
- Fully responsive for all screen sizes

🔒 **Security & Validation**

- Real-time form validation
- Email format validation
- Password strength requirements
- Toggle password visibility
- Remember me functionality

🔌 **API Ready**

- Easy integration with any backend API
- Customizable API endpoint
- Error handling structure in place
- Loading states during submission

## Quick Start

### Option 1: Standalone Demo (Current Setup)

Simply open `index.html` in your browser to see the component in action.

```bash
# Navigate to the module directory
cd sign-in-module

# Open in browser (Windows)
start index.html
```

### Option 2: Integration into React Project

1. **Copy the component** to your React project:

   ```bash
   cp SignIn.jsx /path/to/your/project/src/components/
   ```

2. **Install Tailwind CSS** (if not already installed):

   ```bash
   npm install -D tailwindcss
   npx tailwindcss init
   ```

3. **Import and use** the component:

   ```jsx
   import SignIn from "./components/SignIn";

   function App() {
     return <SignIn />;
   }
   ```

## API Integration

### Connecting to Your Backend

The component is pre-configured for API integration. Update the `handleSubmit` function in `SignIn.jsx`:

**Current code (lines 61-72):**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  // Simulate API call
  setTimeout(() => {
    console.log("Sign in successful!", formData);
    alert("Sign in successful! Check console for details.");
    setIsSubmitting(false);
  }, 1500);
};
```

**Replace with your API endpoint:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    // Make API call to your backend
    const response = await fetch("https://your-api.com/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Success - store token, redirect, etc.
      localStorage.setItem("authToken", data.token);
      window.location.href = "/dashboard";
    } else {
      // Handle errors from API
      setErrors({
        email: data.message || "Invalid credentials",
      });
    }
  } catch (error) {
    // Handle network errors
    setErrors({
      email: "Network error. Please try again.",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Using Axios (Alternative)

If you prefer Axios:

```bash
npm install axios
```

```javascript
import axios from "axios";

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await axios.post("https://your-api.com/api/auth/signin", {
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });

    // Success
    localStorage.setItem("authToken", response.data.token);
    window.location.href = "/dashboard";
  } catch (error) {
    // Handle errors
    setErrors({
      email: error.response?.data?.message || "Sign in failed",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

## Expected API Response Format

Your backend API should return responses in this format:

### Success Response (200 OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## Customization

### Changing Colors

The component uses a gradient color scheme. To customize:

1. **Background gradient** (line 76):

   ```jsx
   className =
     "... bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500";
   ```

2. **Primary button** (line 219):

   ```jsx
   className = "... bg-gradient-to-r from-pink-500 to-purple-600";
   ```

3. **Focus rings** (throughout):
   ```jsx
   focus: ring - pink - 500;
   ```

### Removing Social Login Buttons

If you don't need Google/GitHub login, remove lines 240-276 (the social login section).

### Adding More Fields

To add additional fields (e.g., username):

1. Add to state:

   ```javascript
   const [formData, setFormData] = React.useState({
     username: "", // Add this
     email: "",
     password: "",
     rememberMe: false,
   });
   ```

2. Add validation in `validateForm()`
3. Add the input field in the form (copy the email field structure)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Notes

⚠️ **Important Security Practices:**

1. **Never store passwords in plain text** - Always hash passwords on the backend
2. **Use HTTPS** - Always use secure connections for authentication
3. **Implement rate limiting** - Prevent brute force attacks on your API
4. **Use secure tokens** - JWT or session tokens should be httpOnly and secure
5. **Add CSRF protection** - If using session-based auth
6. **Validate on backend** - Never trust client-side validation alone

## File Structure

```
sign-in-module/
├── SignIn.jsx          # React component
├── index.html          # Demo page
└── README.md           # This file
```

## Support

For issues or questions related to the Automated Fraud Detection System, please refer to the main project documentation.

## License

Part of the Automated Fraud Detection System project.
