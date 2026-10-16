import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const API_BASE = `${(process.env.REACT_APP_API_BASE || 'http://localhost:5000/api').replace(/\/+$/, '')}/auth`;

const SetupPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    const validateLink = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/setup-password/${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(data.message || 'This setup link is invalid or expired.');
        }

        if (active) setUser(data);
      } catch (err) {
        if (active) setError(err.message || 'Unable to validate setup link.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      validateLink();
    } else {
      setError('Setup token is missing.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 1 || password.length > 128) {
      setError('Password must contain between 1 and 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE}/setup-password/${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to set your password.');
      }

      setSuccess(data.message || 'Password set successfully. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Unable to set your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const EyeIcon = ({ visible }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {visible ? (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16.5 16.5 0 0 1-3.1 3.8" />
          <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.5 10.5 0 0 0 4-.8" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      )}
    </svg>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500 text-2xl font-bold text-gray-900 shadow-md">
            N
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Set Up Your Password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Nexora Technology Solutions Private Limited
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600">
            Validating your setup link...
          </div>
        ) : success ? (
          <div className="space-y-5 text-center">
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-gray-800">
              {success}
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-gray-900 transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              Go to Login
            </button>
          </div>
        ) : !user ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-gray-800">
              {error || 'This setup link is invalid or expired.'}
            </div>
            <p className="text-center text-sm text-gray-600">
              Request a new setup link from your HR administrator.
            </p>
            <Link
              to="/login"
              className="block text-center font-semibold text-yellow-700 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-sm text-gray-600">
              Setting up account for{' '}
              <span className="font-semibold text-gray-900">
                {user.name || user.userId}
              </span>
              {user.userId && (
                <p className="mt-1">User ID: {user.userId}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-gray-800">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Your setup link expires after 30 minutes and can only be used once.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-gray-900 transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetupPassword;
