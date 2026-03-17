import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Processing your authentication...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Store token
      localStorage.setItem('authToken', token);

      try {
        // Decode JWT payload (no verification, just reading data)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const user = JSON.parse(jsonPayload);
        localStorage.setItem('user', JSON.stringify(user));

        setMessage(`Welcome, ${user.name || user.email}! You're now signed in.`);

        // Optional role override from OAuth URL
        const loginAs = searchParams.get('loginAs');
        console.log('OAuth loginAs:', loginAs, '| user.role:', user.role);

        // Decide where to send user
        let target = '/customer-dashboard';

        // Admins/analysts usually go to the admin dashboard
        if ((user.role === 'admin' || user.role === 'analyst') && loginAs !== 'user') {
          target = '/admin-dashboard';
        }

        navigate(target);
      } catch (error) {
        console.error('Error decoding token:', error);
        setMessage('Authentication successful! Token stored.');

        // Fallback routing
        navigate('/dashboard');
      }
    } else {
      setMessage('No token received. Please try signing in again.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900">
      <div className="text-center p-8 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Sign-in Successful!</h1>
        <p className="text-white/70 mb-6">{message}</p>
        <Link
          to="/customer-dashboard"
          className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default OAuthSuccess;