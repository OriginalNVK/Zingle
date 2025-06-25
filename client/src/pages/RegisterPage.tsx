import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ROUTE_PATHS, APP_NAME } from '../constants';
import { ZingleLogo, GoogleIcon, FacebookIcon } from '../components/icons';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await register(username, email, password);
      // Auto-login after registration for Zingle flow
      await login(email, password); 
      navigate(ROUTE_PATHS.CHAT);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };
  
  const handleSocialLogin = (provider: string) => {
    console.log(`Attempting login with ${provider}... (Mock)`);
    setError(`${provider} registration is not implemented yet. Please use email/password registration.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-indigo-700 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <ZingleLogo className="w-16 h-16 mx-auto text-primary-600 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">Create your {APP_NAME} Account</h1>
          <p className="text-gray-500">Join the conversation today.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name / Username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Alex Johnson"
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Create a strong password"
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Confirm your password"
          />

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
            Create Account
          </Button>
          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-primary-600 hover:text-primary-500">
              Sign In
            </Link>
          </p>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <Button variant="secondary" onClick={() => handleSocialLogin('Google')} className="w-full">
            <GoogleIcon className="text-red-500 mr-2 w-5 h-5" /> Google
          </Button>
          <Button variant="secondary" onClick={() => handleSocialLogin('Facebook')} className="w-full">
            <FacebookIcon className="text-blue-600 mr-2 w-5 h-5" /> Facebook
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
